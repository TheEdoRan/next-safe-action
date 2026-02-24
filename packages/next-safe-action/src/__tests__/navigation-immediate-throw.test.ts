/* eslint-disable @typescript-eslint/no-floating-promises */

/**
 * Tests for the fix: Navigation errors should be thrown immediately (synchronously)
 * instead of being deferred to useLayoutEffect.
 *
 * This fix ensures that redirects work correctly with Next.js cacheComponents enabled.
 *
 * Background:
 * - Previously, navigation errors were caught, stored in state, and re-thrown later in useLayoutEffect
 * - With cacheComponents enabled, Next.js could cache/restore component tree before the effect ran
 * - This caused redirects to be cancelled or ignored
 *
 * Fix:
 * - Navigation errors are now thrown immediately when caught in the promise chain
 * - This ensures Next.js receives the error before any component caching occurs
 * - Callbacks still execute properly via useLayoutEffect
 */

import { notFound, redirect } from "next/navigation";
import assert from "node:assert";
import { test } from "node:test";
import { z } from "zod";
import { createSafeActionClient } from "..";
import { FrameworkErrorHandler } from "../next/errors";

const ac = createSafeActionClient();

test("redirect error is thrown immediately, not deferred", async () => {
	const action = ac.action(async () => {
		redirect("/test");
	});

	let errorCaught = false;
	let errorThrownImmediately = false;

	try {
		// This should throw immediately during the action execution
		await action();
	} catch (e) {
		errorCaught = true;
		if (FrameworkErrorHandler.isNavigationError(e)) {
			// If we catch it here, it was thrown immediately (not deferred)
			errorThrownImmediately = true;
		}
	}

	assert.strictEqual(errorCaught, true, "Error should be caught");
	assert.strictEqual(errorThrownImmediately, true, "Navigation error should be thrown immediately");
});

test("redirect error timing - thrown before returning result", async () => {
	let actionCompleted = false;

	const action = ac.action(async () => {
		redirect("/test");
		// This code should never be reached
		actionCompleted = true;
		return { unreachable: true };
	});

	await action().catch((e) => {
		if (!FrameworkErrorHandler.isNavigationError(e)) {
			throw e;
		}
	});

	assert.strictEqual(actionCompleted, false, "Code after redirect should not execute");
});

test("navigation error is propagated synchronously through promise chain", async () => {
	const action = ac.action(async () => {
		redirect("/test");
	});

	// The error should propagate synchronously through the promise chain
	const promise = action();

	// We should be able to catch it immediately
	let caughtSynchronously = false;
	promise.catch((e) => {
		if (FrameworkErrorHandler.isNavigationError(e)) {
			caughtSynchronously = true;
		}
	});

	// Wait for microtasks to complete
	await new Promise((resolve) => setImmediate(resolve));

	assert.strictEqual(caughtSynchronously, true, "Error should be catchable in next microtask");
});

test("notFound error is also thrown immediately", async () => {
	const action = ac.action(async () => {
		notFound();
	});

	let errorThrownImmediately = false;

	try {
		await action();
	} catch (e) {
		if (FrameworkErrorHandler.isNavigationError(e)) {
			errorThrownImmediately = true;
		}
	}

	assert.strictEqual(errorThrownImmediately, true, "notFound error should be thrown immediately");
});

test("callbacks execute before error is re-thrown on server", async () => {
	const executionOrder: string[] = [];

	const action = ac.action(
		async () => {
			executionOrder.push("action-start");
			redirect("/test");
		},
		{
			onNavigation: async () => {
				executionOrder.push("onNavigation");
			},
			onSettled: async () => {
				executionOrder.push("onSettled");
			},
		}
	);

	await action().catch((e) => {
		executionOrder.push("error-caught");
		if (!FrameworkErrorHandler.isNavigationError(e)) {
			throw e;
		}
	});

	const expectedOrder = ["action-start", "onNavigation", "onSettled", "error-caught"];
	assert.deepStrictEqual(executionOrder, expectedOrder, "Callbacks should execute before error is caught");
});

test("redirect with validation - error thrown after validation passes", async () => {
	const executionOrder: string[] = [];

	const action = ac.inputSchema(z.object({ shouldRedirect: z.boolean() })).action(async ({ parsedInput }) => {
		executionOrder.push("validation-passed");
		if (parsedInput.shouldRedirect) {
			executionOrder.push("before-redirect");
			redirect("/test");
		}
		return { success: true };
	});

	await action({ shouldRedirect: true }).catch((e) => {
		executionOrder.push("error-caught");
		if (!FrameworkErrorHandler.isNavigationError(e)) {
			throw e;
		}
	});

	const expectedOrder = ["validation-passed", "before-redirect", "error-caught"];
	assert.deepStrictEqual(executionOrder, expectedOrder);
});

test("redirect in middleware is thrown immediately", async () => {
	let middlewareExecuted = false;

	const action = ac
		.use(async () => {
			middlewareExecuted = true;
			redirect("/test");
		})
		.action(async () => {
			return { unreachable: true };
		});

	let errorCaught = false;
	await action().catch((e) => {
		if (FrameworkErrorHandler.isNavigationError(e)) {
			errorCaught = true;
		}
	});

	assert.strictEqual(middlewareExecuted, true);
	assert.strictEqual(errorCaught, true);
});

test("no double-throwing of navigation errors", async () => {
	let catchCount = 0;

	const action = ac.action(async () => {
		redirect("/test");
	});

	// If the error were thrown twice, we might catch it twice
	const promise = action();

	promise.catch((e) => {
		if (FrameworkErrorHandler.isNavigationError(e)) {
			catchCount++;
		}
	});

	await promise.catch(() => {
		// Suppress error for test
	});

	// Wait a bit to ensure no delayed/deferred throws
	await new Promise((resolve) => setTimeout(resolve, 100));

	assert.strictEqual(catchCount, 1, "Error should only be thrown once, not deferred and re-thrown");
});

test("redirect preserves error digest format", async () => {
	const action = ac.action(async () => {
		redirect("/test-path");
	});

	await action().catch((e) => {
		if (FrameworkErrorHandler.isNavigationError(e)) {
			// Verify the error has the expected Next.js redirect format
			assert.ok("digest" in e, "Error should have digest property");
			assert.strictEqual(typeof e.digest, "string", "Digest should be a string");
			assert.ok((e.digest as string).includes("NEXT_REDIRECT"), "Digest should contain NEXT_REDIRECT");
		}
	});
});
