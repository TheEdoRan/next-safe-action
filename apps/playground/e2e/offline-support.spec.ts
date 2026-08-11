import { expect, test, type Page } from "@playwright/test";

async function openPrefetchedSource(page: Page) {
	let destinationPrefetched = false;

	page.on("response", (response) => {
		if (response.request().method() === "GET" && new URL(response.url()).pathname === "/offline-support/destination") {
			destinationPrefetched = true;
		}
	});

	await page.goto("/offline-support");
	await page.getByTestId("offline-destination-link").scrollIntoViewIfNeeded();
	await expect.poll(() => destinationPrefetched).toBe(true);
}

test("shows the reconnecting bar only while offline", async ({ context, page }) => {
	await page.goto("/offline-support");

	await context.setOffline(true);
	await expect(page.getByTestId("offline-bar")).toBeVisible();
	await expect(page.getByTestId("offline-bar")).toHaveAttribute("role", "status");

	await context.setOffline(false);
	await expect(page.getByTestId("offline-bar")).toBeHidden();
});

test("retries a pending safe action after reconnection", async ({ context, page }) => {
	await page.goto("/offline-support");
	await context.setOffline(true);
	await expect(page.getByTestId("offline-bar")).toBeVisible();

	await page.getByRole("button", { name: "Run action" }).click();
	await expect(page.getByTestId("offline-action-state").filter({ visible: true })).toHaveText("Offline");
	await expect(page.getByTestId("offline-action-button").filter({ visible: true })).toHaveText(
		"Offline. Waiting to retry..."
	);

	await context.setOffline(false);
	await expect(page.getByTestId("offline-action-state").filter({ visible: true })).toHaveText("Success");
	await expect(page.getByTestId("offline-action-result").filter({ visible: true })).toContainText('"count"');
	await expect(page.getByTestId("offline-action-result").filter({ visible: true })).toContainText('"serverTimestamp"');
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
	await expect(page.getByTestId("offline-destination-dynamic")).toBeHidden();

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
	await expect.poll(() => page.getByTestId("offline-action-button").count()).toBeGreaterThan(0);

	// Next can either keep the preserved source visible or commit the prefetched shell while the POST is queued.
	await expect
		.poll(async () => {
			return (
				(await page.getByTestId("offline-action-button").filter({ visible: true }).count()) > 0 ||
				(await page.getByTestId("offline-destination-shell").isVisible())
			);
		})
		.toBe(true);
	if (await page.getByTestId("offline-destination-shell").isVisible()) {
		await expect(page.getByTestId("offline-destination-fallback")).toBeVisible();
	}

	const actionResponse = page.waitForResponse(
		(response) => response.request().method() === "POST" && new URL(response.url()).pathname === "/offline-support"
	);
	await context.setOffline(false);
	expect((await actionResponse).ok()).toBe(true);
	await expect(page.getByTestId("offline-destination-shell")).toBeVisible();
	await expect(page.getByTestId("offline-destination-dynamic")).toContainText("Dynamic content received at");
});
