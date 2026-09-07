import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useAction } from "../hooks";
import type { SingleInputActionFn } from "../hooks.types";

// --- Helpers -----------------------------------------------------------------

type TestActionFn = SingleInputActionFn<string, undefined, undefined, { message: string }>;

function createRedirectError(url = "/target"): Error {
	const error = new Error("NEXT_REDIRECT");
	(error as any).digest = `NEXT_REDIRECT;push;${url};307;`;
	return error;
}

/**
 * The hooks no longer use setTimeout, so flushHookTimers just needs to flush
 * microtasks/transitions.
 */
async function flushHookTimers() {
	await act(async () => {
		vi.advanceTimersByTime(0);
	});
	await act(async () => {});
}

// --- Setup -------------------------------------------------------------------

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

// --- Race condition tests ----------------------------------------------------

describe("useAction race condition protections", () => {
	test("rapid execute calls only reflects latest result", async () => {
		const resolvers: Array<(value: any) => void> = [];
		const action = vi.fn<TestActionFn>().mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvers.push(resolve);
				})
		);

		const { result } = renderHook(() => useAction(action));

		// Start first call
		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		// Start second call (supersedes first)
		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		// Resolve first (stale) call
		await act(async () => {
			resolvers[0]({ data: { message: "first" } });
		});
		await flushHookTimers();

		// First call's result should be ignored (stale)
		expect(result.current.result).toEqual({});
		expect(result.current.status).toBe("executing");

		// Resolve second (current) call
		await act(async () => {
			resolvers[1]({ data: { message: "second" } });
		});
		await flushHookTimers();

		// Only second call's result should be reflected
		expect(result.current.result).toStrictEqual({ data: { message: "second" } });
		expect(result.current.status).toBe("hasSucceeded");
	});

	test("stale error response does not update state", async () => {
		const resolvers: Array<{ resolve: (value: any) => void; reject: (reason: any) => void }> = [];
		const action = vi.fn<TestActionFn>().mockImplementation(
			() =>
				new Promise((resolve, reject) => {
					resolvers.push({ resolve, reject });
				})
		);

		const { result } = renderHook(() => useAction(action));

		// Start first call
		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		// Start second call (supersedes first)
		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		// Reject first (stale) call with a non-navigation error
		await act(async () => {
			resolvers[0].reject(new Error("stale failure"));
		});
		await flushHookTimers();

		// Stale error should be ignored -- status should still be executing
		expect(result.current.status).toBe("executing");
		expect(result.current.hasErrored).toBe(false);

		// Resolve second (current) call
		await act(async () => {
			resolvers[1].resolve({ data: { message: "success" } });
		});
		await flushHookTimers();

		// Only second call's result should be reflected
		expect(result.current.result).toStrictEqual({ data: { message: "success" } });
		expect(result.current.status).toBe("hasSucceeded");
	});

	test("reset then new execute ignores stale response from pre-reset call", async () => {
		const resolvers: Array<(value: any) => void> = [];
		const action = vi.fn<TestActionFn>().mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvers.push(resolve);
				})
		);

		const { result } = renderHook(() => useAction(action));

		// Start first call (requestId=1)
		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		expect(result.current.status).toBe("executing");

		// Reset visual state
		act(() => {
			result.current.reset();
		});

		expect(result.current.status).toBe("idle");
		expect(result.current.result).toEqual({});

		// Start new call (requestId=2, supersedes first)
		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		expect(result.current.status).toBe("executing");

		// Resolve first (stale) call -- should be ignored because requestId changed
		await act(async () => {
			resolvers[0]({ data: { message: "stale" } });
		});
		await flushHookTimers();

		expect(result.current.result).toEqual({});
		expect(result.current.status).toBe("executing");

		// Resolve second (current) call
		await act(async () => {
			resolvers[1]({ data: { message: "fresh" } });
		});
		await flushHookTimers();

		expect(result.current.result).toStrictEqual({ data: { message: "fresh" } });
		expect(result.current.status).toBe("hasSucceeded");
	});

	test("reset alone invalidates in-flight execution", async () => {
		const resolvers: Array<(value: any) => void> = [];
		const action = vi.fn<TestActionFn>().mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvers.push(resolve);
				})
		);

		const { result } = renderHook(() => useAction(action));

		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		expect(result.current.status).toBe("executing");

		// Reset mid-flight, without starting a new execution.
		act(() => {
			result.current.reset();
		});

		expect(result.current.status).toBe("idle");

		// Resolve the pre-reset call: it must not repopulate state.
		await act(async () => {
			resolvers[0]({ data: { message: "stale" } });
		});
		await flushHookTimers();

		expect(result.current.result).toEqual({});
		expect(result.current.status).toBe("idle");
		expect(result.current.isExecuting).toBe(false);
	});

	test("stale rejection after reset is not re-thrown outside the hook", async () => {
		const unhandled: unknown[] = [];
		const listener = (reason: unknown) => unhandled.push(reason);
		process.on("unhandledRejection", listener);

		try {
			const resolvers: Array<{ resolve: (value: any) => void; reject: (reason: any) => void }> = [];
			const action = vi.fn<TestActionFn>().mockImplementation(
				() =>
					new Promise((resolve, reject) => {
						resolvers.push({ resolve, reject });
					})
			);

			const { result } = renderHook(() => useAction(action));

			act(() => {
				result.current.execute(undefined);
			});
			await flushHookTimers();

			// Reset mid-flight: the in-flight execution becomes stale.
			act(() => {
				result.current.reset();
			});

			// Reject the pre-reset call: besides not updating state, it must not re-throw
			// (which would surface a dismissed action's error as an unhandled rejection).
			await act(async () => {
				resolvers[0].reject(new Error("stale failure"));
			});
			await flushHookTimers();

			// Give the unhandledRejection event a real macrotask to fire.
			vi.useRealTimers();
			await new Promise((resolve) => setTimeout(resolve, 20));

			expect(unhandled).toStrictEqual([]);
			expect(result.current.status).toBe("idle");
			expect(result.current.hasErrored).toBe(false);
		} finally {
			process.removeListener("unhandledRejection", listener);
		}
	});

	test("current rejection reaches hook state and executeAsync only, never an unhandled rejection", async () => {
		// Regression test for #482: the transition callback used to re-throw the error after
		// delivering it, and that re-throw rejected a promise nobody owned. Vitest stops reporting
		// unhandled rejections while a listener is attached, so the assertion must be explicit.
		const unhandled: unknown[] = [];
		const listener = (reason: unknown) => unhandled.push(reason);
		process.on("unhandledRejection", listener);

		try {
			const error = new Error("offline");
			const action = vi.fn<TestActionFn>().mockRejectedValue(error);
			const onError = vi.fn();

			const { result } = renderHook(() => useAction(action, { onError }));

			act(() => {
				result.current.execute(undefined);
			});
			await flushHookTimers();

			expect(result.current.status).toBe("hasErrored");
			expect(onError).toHaveBeenCalledWith(expect.objectContaining({ error: { thrownError: error } }));

			// Attach the caller's handler before the action settles, so the caller promise itself
			// cannot count as a leak.
			let rejectedError: unknown;
			act(() => {
				void result.current.executeAsync(undefined).catch((e: unknown) => {
					rejectedError = e;
				});
			});
			await flushHookTimers();

			expect(rejectedError).toBe(error);
			expect(result.current.status).toBe("hasErrored");

			// Give the unhandledRejection event a real macrotask to fire.
			vi.useRealTimers();
			await new Promise((resolve) => setTimeout(resolve, 20));

			expect(unhandled).toStrictEqual([]);
		} finally {
			process.removeListener("unhandledRejection", listener);
		}
	});

	test("executeAsync settles even on navigation errors", async () => {
		const redirectError = createRedirectError("/dashboard");
		const action = vi.fn<TestActionFn>().mockRejectedValue(redirectError);

		const { result } = renderHook(() => useAction(action));

		let settled = false;
		let rejectedError: any;

		act(() => {
			void result.current
				.executeAsync(undefined)
				.then(() => {
					settled = true;
				})
				.catch((e) => {
					settled = true;
					rejectedError = e;
				});
		});

		await flushHookTimers();

		// The promise should have settled (rejected with the navigation error)
		expect(settled).toBe(true);
		expect(rejectedError).toBe(redirectError);
		expect(result.current.status).toBe("hasNavigated");
	});

	test("concurrent executeAsync calls all settle", async () => {
		const resolvers: Array<(value: any) => void> = [];
		const action = vi.fn<TestActionFn>().mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvers.push(resolve);
				})
		);

		const { result } = renderHook(() => useAction(action));

		let firstResult: any;
		let firstSettled = false;
		let secondResult: any;
		let secondSettled = false;

		// Start first executeAsync
		act(() => {
			void result.current.executeAsync(undefined).then((r) => {
				firstSettled = true;
				firstResult = r;
			});
		});
		await flushHookTimers();

		// Start second executeAsync (supersedes first in terms of hook state)
		act(() => {
			void result.current.executeAsync(undefined).then((r) => {
				secondSettled = true;
				secondResult = r;
			});
		});
		await flushHookTimers();

		// Resolve first call
		await act(async () => {
			resolvers[0]({ data: { message: "first" } });
		});
		await flushHookTimers();

		// First promise should have settled (executeAsync always resolves)
		expect(firstSettled).toBe(true);
		expect(firstResult).toEqual({ data: { message: "first" } });

		// Hook state should NOT reflect the first (stale) result
		expect(result.current.result).toEqual({});
		expect(result.current.status).toBe("executing");

		// Resolve second call
		await act(async () => {
			resolvers[1]({ data: { message: "second" } });
		});
		await flushHookTimers();

		// Second promise should have settled
		expect(secondSettled).toBe(true);
		expect(secondResult).toEqual({ data: { message: "second" } });

		// Hook state should reflect only the second (current) result
		expect(result.current.result).toStrictEqual({ data: { message: "second" } });
		expect(result.current.status).toBe("hasSucceeded");
	});
});
