import { act, renderHook } from "@testing-library/react";
import * as React from "react";
import { describe, expect, test, vi } from "vitest";
import { useAction, useOptimisticAction, useStateAction } from "../hooks";
import type { SingleInputActionFn, SingleInputStateActionFn } from "../hooks.types";
import type { SafeActionResult } from "../index.types";
import type { StandardSchemaV1 } from "../standard-schema";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type StringSchema = StandardSchemaV1<string, string>;
type TestResult = SafeActionResult<string, StringSchema, undefined, { message: string }>;
type TestActionFn = SingleInputActionFn<string, StringSchema, undefined, { message: string }>;
type TestStateActionFn = SingleInputStateActionFn<string, StringSchema, undefined, { message: string }>;

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

/**
 * Run `dispatch` inside an async transition scope and leave that scope pending.
 *
 * React entangles every update scheduled inside the scope onto the transition lane and
 * withholds the commit until the scope's promise settles. That is the same freeze a real
 * `<form action={execute}>` submit hits in Next.js, where the router suspends on the RSC
 * response while holding the very same lane. A *synchronous* scope does not reproduce it:
 * it returns `undefined`, nothing entangles, and the lane commits normally.
 */
async function dispatchInAsyncTransition(dispatch: () => void, scope: Promise<unknown>) {
	await act(async () => {
		React.startTransition(async () => {
			dispatch();
			await scope;
		});
	});
}

// ─── useAction ───────────────────────────────────────────────────────────────

describe("useAction dispatched inside an ambient transition", () => {
	test("reports the execution while the ambient transition is still frozen", async () => {
		const call = deferred<TestResult>();
		const action = vi.fn<TestActionFn>(() => call.promise);
		const onExecute = vi.fn();
		const scope = deferred<void>();

		const { result } = renderHook(() => useAction(action, { onExecute }));

		await dispatchInAsyncTransition(() => result.current.execute("ambient"), scope.promise);

		// The whole dispatch-time surface must be visible, not just `isPending`.
		expect(result.current.status).toBe("executing");
		expect(result.current.isExecuting).toBe(true);
		expect(result.current.isPending).toBe(true);
		expect(result.current.isIdle).toBe(false);
		expect(result.current.input).toBe("ambient");
		expect(onExecute).toHaveBeenCalledTimes(1);
		expect(onExecute).toHaveBeenCalledWith({ input: "ambient" });

		await act(async () => {
			call.resolve({ data: { message: "done" } });
			scope.resolve();
		});

		expect(result.current.status).toBe("hasSucceeded");
		expect(result.current.isPending).toBe(false);
		expect(result.current.result).toStrictEqual({ data: { message: "done" } });
	});

	test("executeAsync reports the execution and still settles its own promise", async () => {
		const call = deferred<TestResult>();
		const action = vi.fn<TestActionFn>(() => call.promise);
		const scope = deferred<void>();

		const { result } = renderHook(() => useAction(action));

		let settled: TestResult | undefined;
		await dispatchInAsyncTransition(() => {
			void result.current.executeAsync("ambient").then((res) => {
				settled = res;
			});
		}, scope.promise);

		expect(result.current.status).toBe("executing");
		expect(result.current.isPending).toBe(true);
		expect(result.current.input).toBe("ambient");

		await act(async () => {
			call.resolve({ data: { message: "done" } });
			scope.resolve();
		});

		expect(settled).toStrictEqual({ data: { message: "done" } });
		expect(result.current.status).toBe("hasSucceeded");
	});

	test("a mid-flight reset still wins over the frozen execution", async () => {
		const call = deferred<TestResult>();
		const action = vi.fn<TestActionFn>(() => call.promise);
		const scope = deferred<void>();

		const { result } = renderHook(() => useAction(action));

		await dispatchInAsyncTransition(() => result.current.execute("ambient"), scope.promise);
		expect(result.current.isPending).toBe(true);

		await act(async () => {
			result.current.reset();
		});

		expect(result.current.status).toBe("idle");
		expect(result.current.isPending).toBe(false);
		expect(result.current.input).toBeUndefined();

		// The stale call settling must not resurrect it.
		await act(async () => {
			call.resolve({ data: { message: "stale" } });
			scope.resolve();
		});

		expect(result.current.status).toBe("idle");
		expect(result.current.isPending).toBe(false);
		expect(result.current.result).toEqual({});
	});

	// The synchronous pass and the microtask pass are separate dispatches, so the last caller in a
	// tick has to win in both. Each guards on the request id the other one bumped.
	test("the last call in a tick wins, in either order", async () => {
		const action = vi.fn<TestActionFn>(() => deferred<TestResult>().promise);
		const { result } = renderHook(() => useAction(action));

		await act(async () => {
			result.current.execute("first");
			result.current.reset();
		});

		expect(result.current.status).toBe("idle");
		expect(result.current.isPending).toBe(false);
		expect(result.current.input).toBeUndefined();

		await act(async () => {
			result.current.reset();
			result.current.execute("second");
		});

		expect(result.current.status).toBe("executing");
		expect(result.current.isPending).toBe(true);
		expect(result.current.input).toBe("second");
	});

	// `reset` must stay a full bailout when there is nothing to reset: every value it writes is
	// already the current one, so React should skip the re-render entirely. Anything `reset`
	// writes that changes on every call (an id, a counter) silently defeats that.
	test("reset on an idle hook does not re-render", async () => {
		const action = vi.fn<TestActionFn>(() => deferred<TestResult>().promise);

		let renders = 0;
		const { result } = renderHook(() => {
			renders++;
			return useAction(action);
		});

		const rendersBeforeReset = renders;

		await act(async () => {
			result.current.reset();
		});

		expect(renders).toBe(rendersBeforeReset);
		expect(result.current.status).toBe("idle");
	});
});

// ─── useOptimisticAction ─────────────────────────────────────────────────────

describe("useOptimisticAction dispatched inside an ambient transition", () => {
	test("reports the execution alongside the optimistic state", async () => {
		const call = deferred<TestResult>();
		const action = vi.fn<TestActionFn>(() => call.promise);
		const scope = deferred<void>();

		const { result } = renderHook(() =>
			useOptimisticAction(action, {
				currentState: { count: 0 },
				updateFn: (state) => ({ count: state.count + 1 }),
			})
		);

		await dispatchInAsyncTransition(() => result.current.execute("ambient"), scope.promise);

		// The optimistic value was never affected: React owns it. The status surface was.
		expect(result.current.optimisticState).toEqual({ count: 1 });
		expect(result.current.status).toBe("executing");
		expect(result.current.isPending).toBe(true);
		expect(result.current.input).toBe("ambient");

		await act(async () => {
			call.resolve({ data: { message: "done" } });
			scope.resolve();
		});

		expect(result.current.status).toBe("hasSucceeded");
		expect(result.current.optimisticState).toEqual({ count: 0 });
	});
});

// ─── useStateAction ──────────────────────────────────────────────────────────

describe("useStateAction dispatched inside an ambient transition", () => {
	test("reports the execution on a first dispatch", async () => {
		const call = deferred<TestResult>();
		const action = vi.fn<TestStateActionFn>(() => call.promise);
		const onExecute = vi.fn();
		const scope = deferred<void>();

		const { result } = renderHook(() => useStateAction(action, { onExecute }));

		await dispatchInAsyncTransition(() => result.current.formAction("ambient"), scope.promise);

		expect(result.current.status).toBe("executing");
		expect(result.current.isPending).toBe(true);
		expect(result.current.input).toBe("ambient");
		// `useActionState`'s pending flag flips at sync priority, so a commit reading
		// `executing` can land before the dispatch state does. The callback must still
		// fire once, with the real input, not once per commit.
		expect(onExecute).toHaveBeenCalledTimes(1);
		expect(onExecute).toHaveBeenCalledWith({ input: "ambient" });

		await act(async () => {
			call.resolve({ data: { message: "done" } });
			scope.resolve();
		});

		expect(result.current.status).toBe("hasSucceeded");
	});

	test("reports the execution on the dispatch that follows a reset", async () => {
		const first = deferred<TestResult>();
		const second = deferred<TestResult>();
		let callIndex = 0;
		const action = vi.fn<TestStateActionFn>(() => (callIndex++ === 0 ? first.promise : second.promise));

		const { result } = renderHook(() => useStateAction(action));

		// Complete one dispatch, then reset: this is the dialog open/close/reopen pattern.
		const firstScope = deferred<void>();
		await dispatchInAsyncTransition(() => result.current.formAction("first"), firstScope.promise);
		await act(async () => {
			first.resolve({ data: { message: "first" } });
			firstScope.resolve();
		});
		await act(async () => {
			result.current.reset();
		});
		expect(result.current.status).toBe("idle");

		// The dispatch right after the reset is the one that used to report nothing at all.
		const secondScope = deferred<void>();
		await dispatchInAsyncTransition(() => result.current.formAction("second"), secondScope.promise);

		expect(result.current.status).toBe("executing");
		expect(result.current.isExecuting).toBe(true);
		expect(result.current.isPending).toBe(true);
		expect(result.current.input).toBe("second");

		await act(async () => {
			second.resolve({ data: { message: "second" } });
			secondScope.resolve();
		});

		expect(result.current.status).toBe("hasSucceeded");
		expect(result.current.result).toStrictEqual({ data: { message: "second" } });
	});

	// A result of `undefined` must be normalised where it is stored, not per render. Normalising
	// it in the render body allocates a fresh object every time, and `useActionCallbacks` uses
	// result identity to tell a new execution from a replay, so the terminal callbacks would
	// re-fire on every unrelated re-render.
	test("does not re-fire terminal callbacks when the action resolves undefined", async () => {
		const action = vi.fn<TestStateActionFn>(() => Promise.resolve(undefined as never));
		const onSuccess = vi.fn();
		const onSettled = vi.fn();

		const { result, rerender } = renderHook(() => useStateAction(action, { onSuccess, onSettled }));

		await act(async () => {
			result.current.execute("x");
		});
		await act(async () => {});

		expect(result.current.status).toBe("hasSucceeded");
		expect(onSuccess).toHaveBeenCalledTimes(1);
		expect(onSettled).toHaveBeenCalledTimes(1);

		// Unrelated re-renders: nothing about the execution changed.
		rerender();
		await act(async () => {});
		rerender();
		await act(async () => {});

		expect(onSuccess).toHaveBeenCalledTimes(1);
		expect(onSettled).toHaveBeenCalledTimes(1);
	});

	// Repeat dispatches without a reset in between: every one of them must announce itself
	// exactly once. Each dispatch produces a fresh input identity, which is what used to slip
	// past the callback dedupe and fire `onExecute` a second time.
	test("fires onExecute exactly once per dispatch across repeat submits", async () => {
		const calls = [deferred<TestResult>(), deferred<TestResult>(), deferred<TestResult>()];
		let callIndex = 0;
		const action = vi.fn<TestStateActionFn>(() => calls[callIndex++]?.promise ?? Promise.resolve({}));
		const onExecute = vi.fn();

		const { result } = renderHook(() => useStateAction(action, { onExecute }));

		for (const [index, call] of calls.entries()) {
			const scope = deferred<void>();
			await dispatchInAsyncTransition(() => result.current.formAction(`submit-${index}`), scope.promise);

			expect(result.current.status).toBe("executing");
			expect(onExecute).toHaveBeenCalledTimes(index + 1);
			expect(onExecute).toHaveBeenLastCalledWith({ input: `submit-${index}` });

			await act(async () => {
				call.resolve({ data: { message: `done-${index}` } });
				scope.resolve();
			});

			expect(result.current.status).toBe("hasSucceeded");
		}

		expect(onExecute).toHaveBeenCalledTimes(3);
	});
});
