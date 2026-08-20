import { expect, test, type Page } from "@playwright/test";

const SLOW_RESPONSE_MS = 1500;

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The demo renders the action result as JSON, so the server side counter is observable from the UI.
 * Its absolute value depends on how many actions ran before, so tests assert deltas instead.
 */
async function readCount(page: Page) {
	const result = await page.getByTestId("offline-action-result").innerText();
	const match = /"count":\s*(\d+)/.exec(result);

	return match?.[1] ? Number(match[1]) : null;
}

/**
 * `page.goto` resolves on "load", but the offline provider only reacts to the "offline" event once
 * React has hydrated, and a missed event is never replayed. React tags each DOM node it owns with a
 * `__reactFiber$` key, which makes hydration observable without depending on network quiet.
 */
async function waitForHydration(page: Page) {
	await page.waitForFunction(() => {
		const button = document.querySelector('[data-testid="offline-action-button"]');

		return button !== null && Object.keys(button).some((key) => key.startsWith("__reactFiber$"));
	});
}

async function openSource(page: Page) {
	await page.goto("/offline-support");
	await waitForHydration(page);
	await expect(page.getByTestId("offline-bar")).toBeHidden();
}

async function openPrefetchedSource(page: Page) {
	let destinationPrefetched = false;

	page.on("response", (response) => {
		if (
			response.request().method() === "GET" &&
			response.ok() &&
			new URL(response.url()).pathname === "/offline-support/destination"
		) {
			destinationPrefetched = true;
		}
	});

	await page.goto("/offline-support");
	await page.getByTestId("offline-destination-link").scrollIntoViewIfNeeded();
	await expect.poll(() => destinationPrefetched).toBe(true);
	// The segment cache issues the route tree and the shell segments as separate requests. Going
	// offline between them would leave the shell out of the cache, so wait for all of them to land.
	await page.waitForLoadState("networkidle");
}

/** Runs the action from a fresh page, where the result pane still reads "No result yet.". */
async function runFirstAction(page: Page) {
	await page.getByRole("button", { name: "Run action" }).click();
	await expect(page.getByTestId("offline-action-state")).toHaveText("Success");

	const count = await readCount(page);
	expect(count).not.toBeNull();

	return count as number;
}

test("keeps the reconnecting bar hidden while online and toggles it with connectivity", async ({ context, page }) => {
	await openSource(page);

	await context.setOffline(true);
	const bar = page.getByTestId("offline-bar");
	await expect(bar).toBeVisible();
	await expect(bar).toHaveText("Offline. Pending requests will retry when the connection returns.");
	await expect(bar).toHaveAttribute("role", "status");
	await expect(bar).toHaveAttribute("aria-live", "polite");

	await context.setOffline(false);
	await expect(bar).toBeHidden();

	// A second cycle proves the provider keeps listening after it recovers.
	await context.setOffline(true);
	await expect(bar).toBeVisible();
	await context.setOffline(false);
	await expect(bar).toBeHidden();
});

test("runs the action and increments the server counter while online", async ({ page }) => {
	await openSource(page);
	await expect(page.getByTestId("offline-action-state")).toHaveText("Idle");
	await expect(page.getByTestId("offline-action-result")).toHaveText("No result yet.");
	await expect(page.getByRole("button", { name: "Run action" })).toBeEnabled();

	const count = await runFirstAction(page);
	await expect(page.getByTestId("offline-action-result")).toContainText('"serverTimestamp"');
	await expect(page.getByRole("button", { name: "Run action" })).toBeEnabled();

	await page.getByRole("button", { name: "Run action" }).click();
	await expect.poll(() => readCount(page)).toBe(count + 1);
});

test("reports the pending state while an online action is in flight", async ({ page }) => {
	await openSource(page);
	await page.route("**/offline-support", async (route) => {
		if (route.request().method() !== "POST") {
			return route.continue();
		}

		await delay(SLOW_RESPONSE_MS);
		await route.continue();
	});

	await page.getByRole("button", { name: "Run action" }).click();
	await expect(page.getByTestId("offline-action-state")).toHaveText("Pending");
	await expect(page.getByTestId("offline-action-button")).toHaveText("Running action...");
	await expect(page.getByTestId("offline-action-button")).toBeDisabled();

	await expect(page.getByTestId("offline-action-state")).toHaveText("Success");
	await expect(page.getByTestId("offline-action-button")).toBeEnabled();
});

test("retries a pending safe action after reconnection", async ({ context, page }) => {
	await openSource(page);
	await expect(page.getByTestId("offline-action-state")).toHaveText("Idle");

	await context.setOffline(true);
	await expect(page.getByTestId("offline-bar")).toBeVisible();

	await page.getByRole("button", { name: "Run action" }).click();
	await expect(page.getByTestId("offline-action-state")).toHaveText("Offline");
	await expect(page.getByTestId("offline-action-button")).toHaveText("Offline. Waiting to retry...");
	await expect(page.getByTestId("offline-action-button")).toBeDisabled();
	await expect(page.getByTestId("offline-action-result")).toHaveText("No result yet.");

	await context.setOffline(false);
	await expect(page.getByTestId("offline-action-state")).toHaveText("Success");
	await expect(page.getByTestId("offline-action-result")).toContainText('"count"');
	await expect(page.getByTestId("offline-action-result")).toContainText('"serverTimestamp"');
});

test("runs a retried offline action exactly once", async ({ context, page }) => {
	await openSource(page);
	const count = await runFirstAction(page);

	await context.setOffline(true);
	await expect(page.getByTestId("offline-bar")).toBeVisible();
	await page.getByRole("button", { name: "Run action" }).click();
	await expect(page.getByTestId("offline-action-state")).toHaveText("Offline");

	await context.setOffline(false);
	await expect(page.getByTestId("offline-action-state")).toHaveText("Success");
	// A duplicated retry would advance the module level counter by two.
	await expect.poll(() => readCount(page)).toBe(count + 1);
});

test("completes actions queued offline in several pages exactly once", async ({ context, page }) => {
	await openSource(page);
	const count = await runFirstAction(page);

	// The button is disabled while the action is pending, so a second page is the only way to have
	// two queued actions at the same time.
	const otherPage = await context.newPage();
	await openSource(otherPage);

	await context.setOffline(true);
	await expect(page.getByTestId("offline-bar")).toBeVisible();
	await expect(otherPage.getByTestId("offline-bar")).toBeVisible();

	await page.getByRole("button", { name: "Run action" }).click();
	await otherPage.getByRole("button", { name: "Run action" }).click();
	await expect(page.getByTestId("offline-action-state")).toHaveText("Offline");
	await expect(otherPage.getByTestId("offline-action-state")).toHaveText("Offline");

	await context.setOffline(false);
	await expect(otherPage.getByTestId("offline-action-state")).toHaveText("Success");
	// This page already read "Success" from its first run, so wait on the counter instead.
	await expect.poll(() => readCount(page)).not.toBe(count);

	// Both actions ran, neither ran twice, whichever order they reconnected in.
	expect(new Set([await readCount(page), await readCount(otherPage)])).toEqual(new Set([count + 1, count + 2]));

	await otherPage.close();
});

test("queues a navigation to a route that was never prefetched until reconnection", async ({ context, page }) => {
	// Block prefetches so the destination is absent from the segment cache when the connection drops.
	await page.route("**/offline-support/destination**", (route) => {
		const headers = route.request().headers();
		const isPrefetch = "next-router-prefetch" in headers || "next-router-segment-prefetch" in headers;

		return isPrefetch ? route.abort() : route.continue();
	});
	await openSource(page);

	await context.setOffline(true);
	await expect(page.getByTestId("offline-bar")).toBeVisible();

	await page.getByTestId("offline-destination-link").click();
	// Nothing is cached to render, so give the router a window to prove it does not commit.
	await page.waitForTimeout(1000);
	await expect(page.getByTestId("offline-destination-shell")).toHaveCount(0);
	await expect(page.getByTestId("offline-action-button")).toBeVisible();

	await context.setOffline(false);
	await expect(page.getByTestId("offline-destination-shell")).toBeVisible();
	await expect(page.getByTestId("offline-destination-dynamic")).toContainText("Dynamic content received at");
});

test("renders the destination with request-time content on a direct online visit", async ({ page }) => {
	await page.goto("/offline-support/destination");

	await expect(page.getByTestId("offline-destination-shell")).toBeVisible();
	await expect(page.getByTestId("offline-destination-dynamic")).toContainText("Dynamic content received at");
	await expect(page.getByTestId("offline-bar")).toBeHidden();
});

test("shows the online loading fallback while the destination streams", async ({ page }) => {
	await openPrefetchedSource(page);
	await page.route("**/offline-support/destination**", async (route) => {
		const request = route.request();
		const isPrefetch =
			"next-router-prefetch" in request.headers() || "next-router-segment-prefetch" in request.headers();

		if (request.method() !== "GET" || isPrefetch) {
			return route.continue();
		}

		await delay(SLOW_RESPONSE_MS);
		await route.continue();
	});

	await page.getByTestId("offline-destination-link").click();
	await expect(page.getByTestId("offline-destination-shell")).toBeVisible();
	await expect(page.getByTestId("offline-destination-fallback")).toHaveText("Loading request-time content...");
	await expect(page.getByTestId("offline-bar")).toBeHidden();

	await expect(page.getByTestId("offline-destination-dynamic")).toContainText("Dynamic content received at");
});

test("renders a prefetched shell offline and streams dynamic content after reconnection", async ({ context, page }) => {
	await openPrefetchedSource(page);
	await context.setOffline(true);
	await expect(page.getByTestId("offline-bar")).toBeVisible();

	await page.getByTestId("offline-destination-link").click();
	await expect(page.getByTestId("offline-destination-shell")).toBeVisible();
	await expect(page.getByTestId("offline-destination-fallback")).toHaveText(
		"Waiting for connection to load this section..."
	);
	await expect(page.getByTestId("offline-destination-dynamic")).toHaveCount(0);

	await context.setOffline(false);
	await expect(page.getByTestId("offline-destination-dynamic")).toContainText("Dynamic content received at");
	await expect(page.getByTestId("offline-bar")).toBeHidden();
});

test("preserves an offline mutation while navigating to a prefetched shell", async ({ context, page }) => {
	await openPrefetchedSource(page);
	await context.setOffline(true);
	await expect(page.getByTestId("offline-bar")).toBeVisible();

	await page.getByRole("button", { name: "Run action" }).click();
	await expect(page.getByTestId("offline-action-state").filter({ visible: true })).toHaveText("Offline");
	await page.getByTestId("offline-destination-link").click();

	// Next can either keep the preserved source visible or commit the prefetched shell while the POST
	// is queued, so only the queued action itself is asserted here.
	const actionResponse = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" && new URL(response.url()).pathname.startsWith("/offline-support")
	);
	await context.setOffline(false);
	// The response body is a stream the page consumes, so only the status is observable here. Test
	// "retries a pending safe action after reconnection" covers the action result itself.
	expect((await actionResponse).ok()).toBe(true);
	await expect(page.getByTestId("offline-destination-shell")).toBeVisible();
	await expect(page.getByTestId("offline-destination-dynamic")).toContainText("Dynamic content received at");
});

test("fails a full reload while offline and recovers after reconnection", async ({ context, page }) => {
	await openSource(page);
	await context.setOffline(true);
	await expect(page.getByTestId("offline-bar")).toBeVisible();

	// Documented limitation: the demo installs no service worker, so a reload has nothing to serve.
	const reloadError = await page.reload().then(
		() => null,
		(error: Error) => error
	);
	expect(reloadError?.message).toContain("net::ERR_INTERNET_DISCONNECTED");

	await context.setOffline(false);
	await page.reload();
	await expect(page.getByTestId("offline-action-state")).toHaveText("Idle");
	await expect(page.getByTestId("offline-bar")).toBeHidden();
});
