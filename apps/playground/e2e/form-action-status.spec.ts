import { expect, test, type Page } from "@playwright/test";

/**
 * Regression coverage for issue #470.
 *
 * React invokes a `<form action={fn}>` handler inside its own transition, and Next's router
 * suspends on the RSC response while holding that same lane, so anything the hook schedules at
 * dispatch time used to be withheld until the action settled: `status` read `idle` and
 * `isPending` read `false` for the entire request.
 *
 * Only a real Next.js app reproduces that. jsdom has no router to suspend, so the unit tests in
 * `hooks-ambient-transition.test.tsx` have to fake the freeze with an async transition scope.
 * These assertions are the ones that cover the production mechanism, so they must land
 * mid-flight, while the action is still running.
 */

/**
 * `page.goto` resolves on "load", but a form action only enters React's transition path once the
 * form is hydrated; before that the browser submits natively. React tags each DOM node it owns
 * with a `__reactFiber$` key, which makes hydration observable without depending on network quiet.
 */
async function waitForHydration(page: Page, testId: string) {
	await page.waitForFunction((id) => {
		const node = document.querySelector(`[data-testid="${id}"]`);

		return node !== null && Object.keys(node).some((key) => key.startsWith("__reactFiber$"));
	}, testId);
}

test.beforeEach(async ({ page }) => {
	await page.goto("/hooks");
	await waitForHydration(page, "fas-submit");
});

test.describe("useAction with <form action={execute}>", () => {
	test("reports executing for the duration of the submit", async ({ page }) => {
		await expect(page.getByTestId("fas-status")).toHaveText("idle");

		await page.getByTestId("fas-submit").click();

		// Mid-flight: this is the assertion that failed before the fix.
		await expect(page.getByTestId("fas-status")).toHaveText("executing");
		await expect(page.getByTestId("fas-pending")).toHaveText("true");
		await expect(page.getByTestId("fas-input")).toHaveText("Ada");
		await expect(page.getByTestId("fas-submit")).toBeDisabled();

		await expect(page.getByTestId("fas-status")).toHaveText("hasSucceeded");
		await expect(page.getByTestId("fas-pending")).toHaveText("false");
		await expect(page.getByTestId("fas-submit")).toBeEnabled();
	});

	test("reports executing again on the submit that follows a reset", async ({ page }) => {
		await page.getByTestId("fas-submit").click();
		await expect(page.getByTestId("fas-status")).toHaveText("hasSucceeded");

		await page.getByTestId("fas-reset").click();
		await expect(page.getByTestId("fas-status")).toHaveText("idle");
		await expect(page.getByTestId("fas-pending")).toHaveText("false");

		// The dialog open/close/reopen pattern from the issue report.
		await page.getByTestId("fas-submit").click();
		await expect(page.getByTestId("fas-status")).toHaveText("executing");
		await expect(page.getByTestId("fas-pending")).toHaveText("true");
	});
});

test.describe("useStateAction with <form action={formAction}>", () => {
	test("reports executing on the submit that follows a reset", async ({ page }) => {
		await page.getByTestId("fas-state-submit").click();
		await expect(page.getByTestId("fas-state-status")).toHaveText("hasSucceeded");

		await page.getByTestId("fas-state-reset").click();
		await expect(page.getByTestId("fas-state-status")).toHaveText("idle");

		// Before the fix this submit reported nothing at all: every flag stayed false and the
		// status stayed idle for the whole request, with no `isTransitioning` to fall back on.
		await page.getByTestId("fas-state-submit").click();
		await expect(page.getByTestId("fas-state-status")).toHaveText("executing");
		await expect(page.getByTestId("fas-state-pending")).toHaveText("true");

		await expect(page.getByTestId("fas-state-status")).toHaveText("hasSucceeded");
	});
});
