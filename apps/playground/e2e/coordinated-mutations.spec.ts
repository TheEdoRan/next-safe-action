import { expect, test, type Page } from "@playwright/test";

/**
 * Coverage for `useOptimisticStateAction`, in both of its shapes.
 *
 * The property under test is ordering, and ordering only goes wrong when writes actually overlap.
 * jsdom has no real network and no Next.js action queue, so the unit tests in
 * `optimistic-stateful-hooks.test.tsx` have to fake overlap with gated promises. These assertions
 * exercise the production mechanism: real Server Action round trips, queued by React behind one
 * another, with a reducer that is deliberately order-sensitive so a raced pair would settle into a
 * visibly different order.
 */

/**
 * `page.goto` resolves on "load", but a click only enters React's transition path once the tree is
 * hydrated; before that the handler does not exist. React tags each DOM node it owns with a
 * `__reactFiber$` key, which makes hydration observable without depending on network quiet.
 */
async function waitForHydration(page: Page, testId: string) {
	await page.waitForFunction((id) => {
		const node = document.querySelector(`[data-testid="${id}"]`);

		return node !== null && Object.keys(node).some((key) => key.startsWith("__reactFiber$"));
	}, testId);
}

async function labels(page: Page) {
	return page.getByTestId("cm-list").getByRole("listitem").allInnerTexts();
}

test.describe("useOptimisticStateAction with a reduced state", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/coordinated-mutations");
		await waitForHydration(page, "cm-reset");
		// `reset()` restores the client baseline synchronously, so the label below says nothing
		// about `resetItems`. Wait for that response too, or a test can start while the stand-in
		// database is still being restored and race its revalidation.
		await Promise.all([
			page.waitForResponse((res) => res.request().method() === "POST"),
			page.getByTestId("cm-reset").click(),
		]);
		await expect(page.getByTestId("cm-label-0")).toHaveText("Design review");
	});

	test("serializes overlapping moves instead of racing them", async ({ page }) => {
		// Each save takes 1.2s, so these three land well inside the first one's flight.
		await page.getByTestId("cm-down-a").click();
		await expect(page.getByTestId("cm-label-0")).toHaveText("Ship the changelog");

		await page.getByTestId("cm-down-a").click();
		await page.getByTestId("cm-down-a").click();

		// Every move is visible immediately, before any of them has been confirmed.
		await expect(page.getByTestId("cm-label-3")).toHaveText("Design review");
		await expect(page.getByTestId("cm-status")).toHaveText("Saving...");

		await expect(page.getByTestId("cm-status")).toHaveText("Idle.");

		// "a" moved down three times from the top. Applied in order that is last; applied against a
		// shared stale base it would not be.
		expect(await labels(page)).toEqual([
			expect.stringContaining("Ship the changelog"),
			expect.stringContaining("Fix the flaky test"),
			expect.stringContaining("Update the docs"),
			expect.stringContaining("Design review"),
		]);
	});

	test("rolls back a rejected write and keeps the queue usable", async ({ page }) => {
		await page.getByTestId("cm-down-a").click();
		await expect(page.getByTestId("cm-status")).toHaveText("Idle.");
		await expect(page.getByTestId("cm-label-0")).toHaveText("Ship the changelog");

		// Fails input validation, so the server never mutates.
		await page.getByTestId("cm-invalid").click();
		await expect(page.getByTestId("cm-status")).toHaveText("Idle.");

		// Back to the last confirmed order, not to the mount value.
		await expect(page.getByTestId("cm-label-0")).toHaveText("Ship the changelog");
		await expect(page.getByTestId("cm-label-1")).toHaveText("Design review");

		// The next write still builds on that confirmed base.
		await page.getByTestId("cm-up-a").click();
		await expect(page.getByTestId("cm-status")).toHaveText("Idle.");
		await expect(page.getByTestId("cm-label-0")).toHaveText("Design review");
	});

	/**
	 * `Down`, `Reset`, `Down` again, clicked faster than a save. `resetItems` revalidates, so its
	 * payload reaches the client after the second move is already queued. If the move does not
	 * revalidate too, that payload is the newest one the page ever receives while carrying an order
	 * that predates the move, and it silently undoes it. jsdom cannot show this: it needs a real
	 * revalidation racing a real queued write.
	 */
	test("keeps the move that follows a reset, and agrees with the server", async ({ page }) => {
		await page.getByTestId("cm-down-a").click();
		await expect(page.getByTestId("cm-label-1")).toHaveText("Design review");

		await page.getByTestId("cm-reset").click();
		await expect(page.getByTestId("cm-label-0")).toHaveText("Design review");

		await page.getByTestId("cm-down-a").click();
		await expect(page.getByTestId("cm-label-1")).toHaveText("Design review");

		// Everything settles: the discarded write, the reset's revalidation, and the new move.
		await expect(page.getByTestId("cm-status")).toHaveText("Idle.");
		await expect(page.getByTestId("cm-label-0")).toHaveText("Ship the changelog");
		await expect(page.getByTestId("cm-label-1")).toHaveText("Design review");

		// The client must not be showing something the server does not have.
		await page.reload();
		await expect(page.getByTestId("cm-label-0")).toHaveText("Ship the changelog");
		await expect(page.getByTestId("cm-label-1")).toHaveText("Design review");
	});

	/**
	 * The complaint this pins: "the rows do not stay in the position I last saw, they get updated
	 * when the execution finishes". Every move in a queue revalidates, so RSC payloads keep
	 * arriving while later moves are still pending. Each one replaces the confirmed base the
	 * pending payloads fold over, so a payload that has already been acknowledged by the server
	 * must not be folded again, and a pending one must not be rebased onto an older revision.
	 *
	 * Asserted with a `MutationObserver` rather than a poll, because a wrong intermediate order
	 * can appear and be corrected between two `expect` calls without either of them seeing it.
	 */
	test("holds the order the user last saw while the queue drains", async ({ page }) => {
		// Three moves inside the first save's flight. Nothing awaited in between, or each one
		// would settle before the next is clicked and there would be no queue to observe.
		await page.getByTestId("cm-down-a").click();
		await page.getByTestId("cm-down-a").click();
		await page.getByTestId("cm-up-d").click();

		const settled = await labels(page);

		// Everything the list renders from here until the queue drains.
		await page.evaluate(() => {
			const seen: string[] = [];
			(window as unknown as { __orders: string[] }).__orders = seen;
			const list = document.querySelector('[data-testid="cm-list"]')!;
			const read = () => [...list.querySelectorAll("li span:first-child")].map((node) => node.textContent).join("|");

			seen.push(read());
			new MutationObserver(() => {
				const order = read();
				if (order !== seen.at(-1)) seen.push(order);
			}).observe(list, { childList: true, subtree: true, characterData: true });
		});

		await expect(page.getByTestId("cm-status")).toHaveText("Idle.");
		// Well past the last save, so a late payload has time to land and be caught.
		await page.waitForTimeout(2000);

		// One entry, the order that was already on screen: no intermediate revalidation moved it.
		const orders = await page.evaluate(() => (window as unknown as { __orders: string[] }).__orders);
		expect(orders).toEqual([settled.map((label) => label.split("\n")[0]).join("|")]);

		// And the server ran all three moves, in order.
		await page.reload();
		await expect(page.getByTestId("cm-list").getByRole("listitem")).toHaveCount(settled.length);
		expect(await labels(page)).toEqual(settled);
	});

	/**
	 * A `reset` in the middle of a draining queue. React cannot cancel an enqueued
	 * `useActionState` action, so the naive reading is that every queued move still has to run.
	 * It does not: only the dispatch that already reached the server is unrecallable, and the ones
	 * still waiting their turn must be dropped. Letting them run performs writes the user asked to
	 * discard, whose `revalidatePath` payloads then land *after* the reset and drag the list into
	 * an order that was never on screen.
	 *
	 * Counted at the network layer, because that is the property under test: each `moveItem`
	 * execution is one POST tagged with that action's id, so the number of them is the number of
	 * writes that actually happened. The rendered order alone cannot tell "the write was skipped"
	 * from "the write landed and something else overwrote it".
	 */
	test("a reset drops the moves that had not reached the server yet", async ({ page }) => {
		const actionIds: string[] = [];
		page.on("request", (req) => {
			const id = req.method() === "POST" ? req.headers()["next-action"] : undefined;
			if (id) actionIds.push(id);
		});

		// One move on its own, to learn `moveItem`'s action id and leave a confirmed baseline.
		await page.getByTestId("cm-up-b").click();
		await expect(page.getByTestId("cm-status")).toHaveText("Idle.");
		await expect(page.getByTestId("cm-label-0")).toHaveText("Ship the changelog");
		const moveItemId = actionIds[0];
		expect(moveItemId).toBeTruthy();

		// Three more inside the first one's 1.2s flight: one runs, two queue behind it. Nothing is
		// awaited in between, or the queue would drain before the reset lands.
		actionIds.length = 0;
		await page.getByTestId("cm-down-b").click();
		await page.getByTestId("cm-down-a").click();
		await page.getByTestId("cm-down-c").click();
		await page.getByTestId("cm-reset").click();

		// Long enough for all three saves to have run, had they been allowed to.
		await expect(page.getByTestId("cm-status")).toHaveText("Idle.");
		await page.waitForTimeout(4000);

		// Exactly one: the dispatch that was already talking to the server when `reset` ran.
		expect(actionIds.filter((id) => id === moveItemId)).toHaveLength(1);

		// And the client is still showing an order the server actually has.
		const shown = await labels(page);
		await page.reload();
		await expect(page.getByTestId("cm-list").getByRole("listitem")).toHaveCount(shown.length);
		expect(await labels(page)).toEqual(shown);
	});
});

test.describe("useOptimisticStateAction with a pending-changes list", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pending-changes");
		await waitForHydration(page, "pc-board");
	});

	test("two sibling consumers show the same in-flight change", async ({ page }) => {
		await expect(page.getByTestId("pc-count-todo")).toContainText("2");
		await expect(page.getByTestId("pc-count-doing")).toContainText("1");

		await page.getByTestId("pc-move-t1-doing").click();

		// Mid-flight: the board moved the card and the sibling summary recounted, from one shared
		// pending list that neither of them owns.
		await expect(page.getByTestId("pc-column-doing")).toContainText("Write the RFC");
		await expect(page.getByTestId("pc-count-todo")).toContainText("1");
		await expect(page.getByTestId("pc-count-doing")).toContainText("2");
		await expect(page.getByTestId("pc-status")).toHaveText("Saving...");

		// The list drains when the queue settles, and the server data now carries the change.
		await expect(page.getByTestId("pc-status")).toHaveText("Idle");
		await expect(page.getByTestId("pc-count-doing")).toContainText("2");
	});
});
