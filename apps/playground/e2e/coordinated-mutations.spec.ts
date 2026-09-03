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
		await page.getByTestId("cm-reset").click();
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
