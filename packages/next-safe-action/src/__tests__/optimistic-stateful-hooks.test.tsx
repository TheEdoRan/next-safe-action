import { act, render, renderHook, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useOptimisticStateAction } from "../hooks";
import type { SingleInputStateActionFn } from "../hooks.types";
import type { StandardSchemaV1 } from "../standard-schema";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Item = string;
type StringSchema = StandardSchemaV1<Item, Item>;
type TestStateActionFn = SingleInputStateActionFn<string, StringSchema, { formErrors: string[] }, Item[]>;

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

function createRedirectError(url = "/target"): Error {
	const error = new Error("NEXT_REDIRECT");
	(error as any).digest = `NEXT_REDIRECT;push;${url};307;`;
	return error;
}

async function flushHookTimers() {
	await act(async () => {
		vi.advanceTimersByTime(0);
	});
	await act(async () => {});
}

// `currentState` is identity-compared, so every fixture is hoisted out of the render callback.
const seedA: Item[] = ["a"];
const seedOne: Item[] = ["seed"];
const emptyState: Item[] = [];
const serverTruth: Item[] = ["server"];

/** The optimistic reducer under test: append. Non-idempotent, so a double-apply is visible. */
const appendFn = (state: Item[], input: Item): Item[] => [...state, input];
/** A second reducer, to check that a swapped `updateFn` replays the pending payloads. */
const prependFn = (state: Item[], input: Item): Item[] => [input, ...state];

/** Reduced-state server action: returns the full next state, built from `prevResult.data`. */
function createAppendAction(gates?: Array<{ promise: Promise<void> }>) {
	let call = 0;
	return vi.fn<TestStateActionFn>(async (prevResult, input) => {
		const gate = gates?.[call++];
		if (gate) await gate.promise;
		return { data: [...(prevResult.data ?? []), input] };
	});
}

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.clearAllMocks();
});

// ─── Basics ──────────────────────────────────────────────────────────────────

describe("useOptimisticStateAction", () => {
	test("seeds optimisticState from currentState", async () => {
		const action = createAppendAction();
		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		expect(result.current.optimisticState).toEqual(["a"]);
		expect(result.current.status).toBe("idle");
	});

	test("applies the optimistic update immediately and converges on the confirmed value", async () => {
		const gate = deferred<void>();
		const action = createAppendAction([gate]);
		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		await act(async () => {
			result.current.execute("b");
		});

		// Server has not answered yet, but the UI already shows the change.
		expect(result.current.optimisticState).toEqual(["a", "b"]);
		expect(result.current.isExecuting).toBe(true);

		await act(async () => {
			gate.resolve();
			await gate.promise;
		});
		await flushHookTimers();

		expect(result.current.optimisticState).toEqual(["a", "b"]);
		expect(result.current.result.data).toEqual(["a", "b"]);
		expect(result.current.status).toBe("hasSucceeded");
	});
});

// ─── Queueing ────────────────────────────────────────────────────────────────

describe("useOptimisticStateAction queueing", () => {
	test("serializes overlapping dispatches and folds both without double-applying", async () => {
		const g1 = deferred<void>();
		const g2 = deferred<void>();
		const action = createAppendAction([g1, g2]);

		const { result } = renderHook(() =>
			useOptimisticStateAction(action, { currentState: emptyState, updateFn: appendFn })
		);

		await act(async () => {
			result.current.execute("a");
		});
		await act(async () => {
			result.current.execute("b");
		});

		expect(result.current.optimisticState).toEqual(["a", "b"]);

		await act(async () => {
			g1.resolve();
			await g1.promise;
		});
		await flushHookTimers();

		// The second dispatch is still in flight: an append reducer would show ["a","a","b"]
		// if its payload were re-applied over an already-advanced confirmed state.
		expect(result.current.optimisticState).toEqual(["a", "b"]);

		await act(async () => {
			g2.resolve();
			await g2.promise;
		});
		await flushHookTimers();

		expect(result.current.optimisticState).toEqual(["a", "b"]);
		expect(result.current.result.data).toEqual(["a", "b"]);
	});

	test("carries confirmed state forward: the second dispatch sees the first's result", async () => {
		const action = createAppendAction();
		const { result } = renderHook(() =>
			useOptimisticStateAction(action, { currentState: seedOne, updateFn: appendFn })
		);

		await act(async () => {
			result.current.execute("a");
		});
		await flushHookTimers();
		await act(async () => {
			result.current.execute("b");
		});
		await flushHookTimers();

		expect(action.mock.calls[0]?.[0]).toEqual({ data: ["seed"] });
		expect(action.mock.calls[1]?.[0]).toEqual({ data: ["seed", "a"] });
		expect(result.current.optimisticState).toEqual(["seed", "a", "b"]);
	});
});

// ─── Error paths ─────────────────────────────────────────────────────────────

describe("useOptimisticStateAction error handling", () => {
	test("rolls back to the last confirmed state on a validation error", async () => {
		const action = vi.fn<TestStateActionFn>(async (prevResult, input) =>
			input === "bad" ? { validationErrors: { formErrors: ["nope"] } } : { data: [...(prevResult.data ?? []), input] }
		);

		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		await act(async () => {
			result.current.execute("good");
		});
		await flushHookTimers();
		expect(result.current.optimisticState).toEqual(["a", "good"]);

		await act(async () => {
			result.current.execute("bad");
		});
		await flushHookTimers();

		// Not ["a"] (the mount value) and not undefined: the last CONFIRMED state.
		expect(result.current.optimisticState).toEqual(["a", "good"]);
		expect(result.current.result.validationErrors).toEqual({ formErrors: ["nope"] });
		expect(result.current.status).toBe("hasErrored");
	});

	test("a failed dispatch does not poison prevResult for the next one", async () => {
		const action = vi.fn<TestStateActionFn>(async (prevResult, input) =>
			input === "bad" ? { validationErrors: { formErrors: ["nope"] } } : { data: [...(prevResult.data ?? []), input] }
		);

		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		await act(async () => {
			result.current.execute("bad");
		});
		await flushHookTimers();
		await act(async () => {
			result.current.execute("good");
		});
		await flushHookTimers();

		// Without normalization this would be { validationErrors: ... } and the state would be lost.
		expect(action.mock.calls[1]?.[0]).toEqual({ data: ["a"] });
		expect(result.current.optimisticState).toEqual(["a", "good"]);
	});

	test("rolls back on a server error", async () => {
		const action = vi.fn<TestStateActionFn>(async () => ({ serverError: "boom" }));
		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		await act(async () => {
			result.current.execute("b");
		});
		await flushHookTimers();

		expect(result.current.optimisticState).toEqual(["a"]);
		expect(result.current.result.serverError).toBe("boom");
	});

	test("a raw thrown error holds the optimistic value, matching useStateAction", async () => {
		const action = vi.fn<TestStateActionFn>(async () => {
			throw new Error("kaboom");
		});
		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		// `wrappedAction` re-throws non-navigation errors so they reach a React error boundary.
		try {
			await act(async () => {
				result.current.execute("b");
			});
		} catch {
			/* expected */
		}
		await flushHookTimers();

		// Pre-existing `useStateAction` behaviour, not specific to this hook: React never commits a
		// result for a rejected action, so its pending flag never clears and `status` stays
		// `executing`. React holds an optimistic value for as long as its Action is pending, so the
		// update is still shown. Errors surfaced through the result envelope (`serverError` /
		// `validationErrors` / `returnServerError`) settle normally and do roll back.
		expect(result.current.status).toBe("executing");
		expect(result.current.optimisticState).toEqual(["a", "b"]);
	});

	test("reports navigation and rolls back", async () => {
		const action = vi.fn<TestStateActionFn>(async () => {
			throw createRedirectError();
		});
		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		await act(async () => {
			result.current.execute("b");
		});
		await flushHookTimers();

		expect(result.current.optimisticState).toEqual(["a"]);
		expect(result.current.hasNavigated).toBe(true);
	});
});

// ─── Confirmed-state rule ────────────────────────────────────────────────────

describe("useOptimisticStateAction confirmed state", () => {
	test("a changed currentState prop wins over the client-side fold", async () => {
		const action = createAppendAction();
		const { result, rerender } = renderHook(
			({ currentState }: { currentState: Item[] }) =>
				useOptimisticStateAction(action, { currentState, updateFn: appendFn }),
			{ initialProps: { currentState: seedA } }
		);

		await act(async () => {
			result.current.execute("b");
		});
		await flushHookTimers();
		expect(result.current.optimisticState).toEqual(["a", "b"]);

		// Simulates a revalidated Server Component payload.
		await act(async () => {
			rerender({ currentState: ["server", "truth"] });
		});

		expect(result.current.optimisticState).toEqual(["server", "truth"]);
	});

	test("an unstable currentState degrades gracefully instead of looping", async () => {
		const gate = deferred<void>();
		const action = createAppendAction([gate]);
		let renders = 0;

		// Inline literal: a new identity on every render. This is how the pending-changes-list
		// variant is naturally written, so it must not cost a render loop.
		const { result } = renderHook(() => {
			renders++;
			return useOptimisticStateAction(action, { currentState: ["a"], updateFn: appendFn });
		});

		await act(async () => {
			result.current.execute("b");
		});

		expect(result.current.optimisticState).toEqual(["a", "b"]);
		expect(result.current.isExecuting).toBe(true);
		expect(renders).toBeLessThan(10);

		await act(async () => {
			gate.resolve();
			await gate.promise;
		});
		await flushHookTimers();

		// Confirmed never advances past the ever-fresh prop, so the fold drains. No loop.
		expect(result.current.optimisticState).toEqual(["a"]);
	});

	test("a currentState that commits mid-flight becomes the base for the next queued dispatch", async () => {
		const gate = deferred<void>();
		const action = createAppendAction([gate]);
		const { result, rerender } = renderHook(
			({ currentState }: { currentState: Item[] }) =>
				useOptimisticStateAction(action, { currentState, updateFn: appendFn }),
			{ initialProps: { currentState: seedA } }
		);

		await act(async () => {
			result.current.execute("x");
		});

		// A revalidated Server Component payload lands while "x" is still in flight, so "x" was
		// computed from a revision the server has already moved past.
		await act(async () => {
			rerender({ currentState: serverTruth });
		});

		await act(async () => {
			result.current.execute("y");
		});

		await act(async () => {
			gate.resolve();
			await gate.promise;
		});
		await flushHookTimers();

		// "y" must build on the revalidated payload, not on ["a", "x"]. Without this the guide's
		// documented rule (a fresh `currentState` beats a stale client fold) silently does not hold
		// as soon as a dispatch overlaps the revalidation.
		expect(action.mock.calls[1]?.[0]).toEqual({ data: serverTruth });
	});

	test("a stable currentState prop leaves the action's data authoritative", async () => {
		const action = createAppendAction();
		const { result, rerender } = renderHook(() =>
			useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn })
		);

		await act(async () => {
			result.current.execute("b");
		});
		await flushHookTimers();
		await act(async () => {
			rerender();
		});

		expect(result.current.optimisticState).toEqual(["a", "b"]);
	});
});

// ─── Reset ───────────────────────────────────────────────────────────────────

describe("useOptimisticStateAction reset", () => {
	test("restores the initial state and ignores pre-reset optimistic payloads", async () => {
		const gate = deferred<void>();
		const action = createAppendAction([gate]);
		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		await act(async () => {
			result.current.execute("b");
		});
		expect(result.current.optimisticState).toEqual(["a", "b"]);

		await act(async () => {
			result.current.reset();
		});
		await flushHookTimers();

		// The in-flight transition still holds payload "b"; the generation guard drops it.
		expect(result.current.optimisticState).toEqual(["a"]);
		expect(result.current.status).toBe("idle");

		await act(async () => {
			gate.resolve();
			await gate.promise;
		});
		await flushHookTimers();

		expect(result.current.optimisticState).toEqual(["a"]);
	});

	// Needs a real component, not `renderHook`: two `reset()` calls only land in the same batch
	// inside a discrete event handler. Under `act` alone React re-renders between them, which hides
	// the bug. And it must be read mid-flight, because once the action settles the committed result
	// supplies the same value the dropped payload would have.
	test("two resets batched into one event keep accepting optimistic updates", async () => {
		const gate = deferred<void>();
		const action = createAppendAction([gate]);

		function Demo() {
			const { optimisticState, execute, reset } = useOptimisticStateAction(action, {
				currentState: seedA,
				updateFn: appendFn,
			});

			return (
				<div>
					<span data-testid="state">{JSON.stringify(optimisticState)}</span>
					<button
						data-testid="double-reset"
						onClick={() => {
							reset();
							reset();
						}}
					/>
					<button data-testid="go" onClick={() => execute("b")} />
				</div>
			);
		}

		render(<Demo />);

		// The internal reset generation advances twice. A generation derived from rendered state
		// would only reach one, and every later payload would be dropped for carrying a value the
		// frame never reaches.
		await act(async () => {
			screen.getByTestId("double-reset").click();
		});
		await act(async () => {
			screen.getByTestId("go").click();
		});

		expect(screen.getByTestId("state").textContent).toBe(JSON.stringify(["a", "b"]));

		await act(async () => {
			gate.resolve();
			await gate.promise;
		});
	});

	test("a cancelled dispatch's result does not resurface on the next dispatch", async () => {
		const g1 = deferred<void>();
		const g2 = deferred<void>();
		const action = createAppendAction([g1, g2]);
		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		await act(async () => {
			result.current.execute("x");
		});
		await act(async () => {
			result.current.reset();
		});
		await flushHookTimers();

		// The cancelled dispatch settles anyway: `useActionState` dispatches can't be aborted.
		await act(async () => {
			g1.resolve();
			await g1.promise;
		});
		await flushHookTimers();

		// The next dispatch lifts the `isReset` mask that was hiding X's raw result.
		await act(async () => {
			result.current.execute("y");
		});

		// "x" was discarded, so it must not reappear underneath "y".
		expect(result.current.optimisticState).toEqual(["a", "y"]);

		await act(async () => {
			g2.resolve();
			await g2.promise;
		});
		await flushHookTimers();

		expect(result.current.optimisticState).toEqual(["a", "y"]);
	});
});

// ─── Callbacks ───────────────────────────────────────────────────────────────

describe("useOptimisticStateAction callbacks", () => {
	test("fires once per dispatch, in dispatch order, while the queue drains", async () => {
		const action = createAppendAction();
		const onExecute = vi.fn();
		const onSuccess = vi.fn();
		const onSettled = vi.fn();

		const { result } = renderHook(() =>
			useOptimisticStateAction(action, {
				currentState: emptyState,
				updateFn: appendFn,
				onExecute,
				onSuccess,
				onSettled,
			})
		);

		await act(async () => {
			result.current.execute("a");
		});
		await act(async () => {
			result.current.execute("b");
		});
		await flushHookTimers();

		expect(onExecute).toHaveBeenCalledTimes(2);
		expect(onExecute.mock.calls.map((c) => c[0].input)).toEqual(["a", "b"]);
		expect(onSuccess).toHaveBeenCalledTimes(2);
		expect(onSuccess.mock.calls.map((c) => c[0].input)).toEqual(["a", "b"]);
		expect(onSuccess.mock.calls[1]?.[0].data).toEqual(["a", "b"]);
		expect(onSettled).toHaveBeenCalledTimes(2);
	});

	test("fires onError per failed dispatch", async () => {
		const action = vi.fn<TestStateActionFn>(async () => ({ serverError: "boom" }));
		const onError = vi.fn();
		const onSuccess = vi.fn();

		const { result } = renderHook(() =>
			useOptimisticStateAction(action, {
				currentState: emptyState,
				updateFn: appendFn,
				onError,
				onSuccess,
			})
		);

		await act(async () => {
			result.current.execute("a");
		});
		await flushHookTimers();

		expect(onError).toHaveBeenCalledTimes(1);
		expect(onError.mock.calls[0]?.[0].error.serverError).toBe("boom");
		expect(onSuccess).not.toHaveBeenCalled();
	});
});

// ─── formAction ──────────────────────────────────────────────────────────────

describe("useOptimisticStateAction formAction", () => {
	test("applies the optimistic update on the form dispatch path", async () => {
		const gate = deferred<void>();
		const action = createAppendAction([gate]);
		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		// React invokes form actions inside its own transition; without an ambient one the
		// optimistic value has no Action to hold it. This mirrors a real `<form action={...}>`.
		const scope = deferred<void>();
		await act(async () => {
			React.startTransition(async () => {
				result.current.formAction("b");
				await scope.promise;
			});
		});

		expect(result.current.optimisticState).toEqual(["a", "b"]);

		await act(async () => {
			gate.resolve();
			scope.resolve();
			await gate.promise;
		});
		await flushHookTimers();

		expect(result.current.result.data).toEqual(["a", "b"]);
	});
});

// ─── Callback isolation ──────────────────────────────────────────────────────

describe("useOptimisticStateAction callback isolation", () => {
	test("a synchronous throw in onExecute does not strand the dispatch", async () => {
		const action = createAppendAction();
		const onExecute = vi.fn(() => {
			throw new Error("callback exploded");
		});
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		const { result } = renderHook(() =>
			useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn, onExecute })
		);

		// `Promise.resolve(cb(arg))` evaluates `cb(arg)` first, so this throw escapes before there
		// is a promise to catch it on. It used to surface inside `onTransitionStart`, before the
		// resolver entry was enqueued and the dispatcher ran.
		let settled: unknown;
		await act(async () => {
			settled = await result.current.executeAsync("b");
		});
		await flushHookTimers();

		expect(onExecute).toHaveBeenCalledTimes(1);
		expect(settled).toEqual({ data: ["a", "b"] });
		expect(result.current.optimisticState).toEqual(["a", "b"]);
		expect(consoleError).toHaveBeenCalled();

		consoleError.mockRestore();
	});

	test("a raw throw settles the promises of dispatches queued behind it", async () => {
		const g1 = deferred<void>();
		let call = 0;
		const action = vi.fn<TestStateActionFn>(async (prevResult, input) => {
			if (call++ === 0) {
				await g1.promise;
				throw new Error("kaboom");
			}
			return { data: [...(prevResult.data ?? []), input] };
		});

		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		const outcomes: string[] = [];
		await act(async () => {
			result.current.executeAsync("a").then(
				() => outcomes.push("a:resolved"),
				() => outcomes.push("a:rejected")
			);
			result.current.executeAsync("b").then(
				() => outcomes.push("b:resolved"),
				() => outcomes.push("b:rejected")
			);
		});

		// React tears down its whole action queue when an Action rejects, so B's `wrappedAction`
		// never runs. Its promise must still settle rather than hang forever.
		// `wrappedAction` re-throws non-navigation errors so they reach a React error boundary.
		try {
			await act(async () => {
				g1.resolve();
				await g1.promise;
			});
		} catch {
			/* expected */
		}
		await flushHookTimers();

		expect(outcomes).toContain("a:rejected");
		expect(outcomes).toContain("b:rejected");
	});
});

// ─── Pending-changes-list variant ────────────────────────────────────────────

describe("useOptimisticStateAction pending-changes-list variant", () => {
	test("a constant base with an append reducer drains when the queue settles", async () => {
		const gate = deferred<void>();
		// Returns no data, so `currentState` stays authoritative.
		const action = vi.fn<SingleInputStateActionFn<string, StringSchema, undefined, void>>(async () => {
			await gate.promise;
			return { data: undefined };
		});

		const { result } = renderHook(() =>
			useOptimisticStateAction(action, { currentState: emptyState, updateFn: appendFn })
		);

		await act(async () => {
			result.current.execute("c1");
		});
		expect(result.current.optimisticState).toEqual(["c1"]);

		await act(async () => {
			gate.resolve();
			await gate.promise;
		});
		await flushHookTimers();

		// The pending list drains: confirmed never advanced past the constant base.
		expect(result.current.optimisticState).toEqual([]);
	});
});

// ─── Callback isolation, settle side ─────────────────────────────────────────

describe("useOptimisticStateAction callback isolation on settle", () => {
	// `onDispatchSettled` runs *inside* `wrappedAction`, after the server call already succeeded.
	// A synchronous throw there escapes before `Promise.resolve` exists to catch it, lands in
	// `wrappedAction`'s own catch, and turns a successful server result into a rejected Action:
	// React then drops the committed result and tears the queue down.
	test("a synchronous throw in onSuccess does not turn a success into a rejection", async () => {
		const action = createAppendAction();
		const onSuccess = vi.fn(() => {
			throw new Error("onSuccess exploded");
		});
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		const { result } = renderHook(() =>
			useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn, onSuccess })
		);

		let settled: unknown;
		await act(async () => {
			settled = await result.current.executeAsync("b");
		});
		await flushHookTimers();

		expect(settled).toEqual({ data: ["a", "b"] });
		expect(result.current.status).toBe("hasSucceeded");
		expect(result.current.result.data).toEqual(["a", "b"]);
		expect(result.current.optimisticState).toEqual(["a", "b"]);
		expect(consoleError).toHaveBeenCalled();

		consoleError.mockRestore();
	});

	test("a synchronous throw in onSettled does not turn a success into a rejection", async () => {
		const action = createAppendAction();
		const onSettled = vi.fn(() => {
			throw new Error("onSettled exploded");
		});
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		const { result } = renderHook(() =>
			useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn, onSettled })
		);

		await act(async () => {
			result.current.execute("b");
		});
		await flushHookTimers();

		expect(result.current.status).toBe("hasSucceeded");
		expect(result.current.result.data).toEqual(["a", "b"]);
		expect(consoleError).toHaveBeenCalled();

		consoleError.mockRestore();
	});

	test("a rejected async callback is reported, not propagated", async () => {
		const action = createAppendAction();
		const onSuccess = vi.fn(async () => {
			throw new Error("async boom");
		});
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		const { result } = renderHook(() =>
			useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn, onSuccess })
		);

		await act(async () => {
			result.current.execute("b");
		});
		await flushHookTimers();

		expect(result.current.status).toBe("hasSucceeded");
		expect(result.current.optimisticState).toEqual(["a", "b"]);
		expect(consoleError).toHaveBeenCalled();

		consoleError.mockRestore();
	});

	// The queue must keep draining even when the *first* dispatch's callbacks blow up.
	test("a throwing callback on the first dispatch does not cancel the queued second", async () => {
		const g1 = deferred<void>();
		const g2 = deferred<void>();
		const action = createAppendAction([g1, g2]);
		let calls = 0;
		const onSettled = vi.fn(() => {
			if (calls++ === 0) throw new Error("first settle exploded");
		});
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		const { result } = renderHook(() =>
			useOptimisticStateAction(action, { currentState: emptyState, updateFn: appendFn, onSettled })
		);

		await act(async () => {
			result.current.execute("a");
		});
		await act(async () => {
			result.current.execute("b");
		});
		await act(async () => {
			g1.resolve();
			g2.resolve();
			await g1.promise;
			await g2.promise;
		});
		await flushHookTimers();

		expect(onSettled).toHaveBeenCalledTimes(2);
		expect(result.current.result.data).toEqual(["a", "b"]);
		expect(result.current.optimisticState).toEqual(["a", "b"]);

		consoleError.mockRestore();
	});
});

// ─── Stale raw throw vs. reset ───────────────────────────────────────────────

describe("useOptimisticStateAction stale throw after reset", () => {
	// React tears down its whole action queue when an Action rejects. A dispatch that a `reset`
	// already made invisible must therefore swallow its own throw: rethrowing would cancel the
	// fresh dispatches queued *after* the reset, which the user is still waiting on.
	test("a pre-reset raw throw does not cancel a dispatch queued after the reset", async () => {
		const g1 = deferred<void>();
		const g2 = deferred<void>();
		let call = 0;
		const action = vi.fn<TestStateActionFn>(async (prevResult, input) => {
			const idx = call++;
			if (idx === 0) {
				await g1.promise;
				throw new Error("kaboom");
			}
			await g2.promise;
			return { data: [...(prevResult.data ?? []), input] };
		});

		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		const outcomes: string[] = [];
		await act(async () => {
			result.current.executeAsync("x").then(
				() => outcomes.push("x:resolved"),
				() => outcomes.push("x:rejected")
			);
		});

		await act(async () => {
			result.current.reset();
		});

		await act(async () => {
			result.current.executeAsync("y").then(
				() => outcomes.push("y:resolved"),
				() => outcomes.push("y:rejected")
			);
		});

		await act(async () => {
			g1.resolve();
			await g1.promise;
		});
		await act(async () => {
			g2.resolve();
			await g2.promise;
		});
		await flushHookTimers();

		// The discarded dispatch still rejects its own promise, but "y" survives and commits.
		expect(outcomes).toContain("x:rejected");
		expect(outcomes).toContain("y:resolved");
		expect(action).toHaveBeenCalledTimes(2);
		// "y" builds on the reset baseline, never on the discarded dispatch.
		expect(action.mock.calls[1]?.[0]).toEqual({ data: ["a"] });
		expect(result.current.result.data).toEqual(["a", "y"]);
		expect(result.current.optimisticState).toEqual(["a", "y"]);
		expect(result.current.status).toBe("hasSucceeded");
	});

	test("a pre-reset raw throw leaves the hook idle when nothing is queued behind it", async () => {
		const gate = deferred<void>();
		const action = vi.fn<TestStateActionFn>(async () => {
			await gate.promise;
			throw new Error("kaboom");
		});

		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		await act(async () => {
			result.current.execute("x");
		});
		await act(async () => {
			result.current.reset();
		});
		await act(async () => {
			gate.resolve();
			await gate.promise;
		});
		await flushHookTimers();

		// Swallowed, so no `thrownError` surfaces and the discarded state is not restored.
		expect(result.current.status).toBe("idle");
		expect(result.current.optimisticState).toEqual(["a"]);
	});
});

// ─── Render purity ───────────────────────────────────────────────────────────

describe("useOptimisticStateAction render purity", () => {
	// The confirmed value is derived purely and every ref write is deferred to a layout effect,
	// because React shares ref objects between the current and the work-in-progress fiber. These
	// two tests pin the double-invoke half of that: `propChanged`, `committedIsFresh` and the
	// optimistic reducer all run twice per render and must reach the same answer both times. The
	// abandoned-render half (a Suspense retry that never commits) is not reachable from a test;
	// it is guarded by the layout-effect placement alone.
	test("a StrictMode double render still lets a fresh currentState win", async () => {
		const action = createAppendAction();
		const { result, rerender } = renderHook(
			({ currentState }: { currentState: Item[] }) =>
				useOptimisticStateAction(action, { currentState, updateFn: appendFn }),
			{
				initialProps: { currentState: seedA },
				wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>,
			}
		);

		await act(async () => {
			result.current.execute("b");
		});
		await flushHookTimers();
		expect(result.current.optimisticState).toEqual(["a", "b"]);

		await act(async () => {
			rerender({ currentState: serverTruth });
		});

		expect(result.current.optimisticState).toEqual(["server"]);

		// The next dispatch must build on the revalidated payload, not on the client fold.
		await act(async () => {
			result.current.execute("c");
		});
		await flushHookTimers();

		expect(action.mock.calls[1]?.[0]).toEqual({ data: ["server"] });
		expect(result.current.optimisticState).toEqual(["server", "c"]);
	});

	test("a StrictMode double render keeps the queued prevResult chain intact", async () => {
		const action = createAppendAction();
		const { result } = renderHook(
			() => useOptimisticStateAction(action, { currentState: seedOne, updateFn: appendFn }),
			{ wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode> }
		);

		await act(async () => {
			result.current.execute("a");
		});
		await flushHookTimers();
		await act(async () => {
			result.current.execute("b");
		});
		await flushHookTimers();

		expect(action.mock.calls[0]?.[0]).toEqual({ data: ["seed"] });
		expect(action.mock.calls[1]?.[0]).toEqual({ data: ["seed", "a"] });
		expect(result.current.optimisticState).toEqual(["seed", "a", "b"]);
	});
});

// ─── Navigation ──────────────────────────────────────────────────────────────

describe("useOptimisticStateAction navigation", () => {
	test("fires onNavigation and onSettled with the navigation kind", async () => {
		const action = vi.fn<TestStateActionFn>(async () => {
			throw createRedirectError();
		});
		const onNavigation = vi.fn();
		const onSettled = vi.fn();
		const onError = vi.fn();
		const onSuccess = vi.fn();

		const { result } = renderHook(() =>
			useOptimisticStateAction(action, {
				currentState: seedA,
				updateFn: appendFn,
				onNavigation,
				onSettled,
				onError,
				onSuccess,
			})
		);

		await act(async () => {
			result.current.execute("b");
		});
		await flushHookTimers();

		expect(onNavigation).toHaveBeenCalledTimes(1);
		expect(onNavigation.mock.calls[0]?.[0]).toEqual({ input: "b", navigationKind: "redirect" });
		expect(onSettled).toHaveBeenCalledTimes(1);
		expect(onSettled.mock.calls[0]?.[0].navigationKind).toBe("redirect");
		expect(onError).not.toHaveBeenCalled();
		expect(onSuccess).not.toHaveBeenCalled();
	});

	test("throwOnNavigation surfaces the error and suppresses the navigation callbacks", async () => {
		const action = vi.fn<TestStateActionFn>(async () => {
			throw createRedirectError();
		});
		const onNavigation = vi.fn();
		const onSettled = vi.fn();
		let captured: Error | null = null;

		class Boundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
			state = { hasError: false };
			static getDerivedStateFromError(error: Error) {
				captured = error;
				return { hasError: true };
			}
			render() {
				return this.state.hasError ? null : this.props.children;
			}
		}

		const { result } = renderHook(
			() =>
				useOptimisticStateAction(action, {
					currentState: seedA,
					updateFn: appendFn,
					throwOnNavigation: true,
					onNavigation,
					onSettled,
				}),
			{ wrapper: ({ children }) => <Boundary>{children}</Boundary> }
		);

		await act(async () => {
			result.current.execute("b");
		});
		await flushHookTimers();

		expect((captured as Error | null)?.message).toBe("NEXT_REDIRECT");
		expect(onNavigation).not.toHaveBeenCalled();
		expect(onSettled).not.toHaveBeenCalled();
	});

	test("a navigating dispatch does not poison the base for the next one", async () => {
		let call = 0;
		const action = vi.fn<TestStateActionFn>(async (prevResult, input) => {
			if (call++ === 1) throw createRedirectError();
			return { data: [...(prevResult.data ?? []), input] };
		});

		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		await act(async () => {
			result.current.execute("b");
		});
		await flushHookTimers();
		await act(async () => {
			result.current.execute("nav");
		});
		await flushHookTimers();
		await act(async () => {
			result.current.execute("c");
		});
		await flushHookTimers();

		expect(action.mock.calls[2]?.[0]).toEqual({ data: ["a", "b"] });
		expect(result.current.optimisticState).toEqual(["a", "b", "c"]);
	});
});

// ─── executeAsync ────────────────────────────────────────────────────────────

describe("useOptimisticStateAction executeAsync", () => {
	test("each queued promise resolves with its own dispatch's result", async () => {
		const g1 = deferred<void>();
		const g2 = deferred<void>();
		const action = createAppendAction([g1, g2]);
		const { result } = renderHook(() =>
			useOptimisticStateAction(action, { currentState: emptyState, updateFn: appendFn })
		);

		const settled: unknown[] = [];
		await act(async () => {
			void result.current.executeAsync("a").then((r) => settled.push(r));
		});
		await act(async () => {
			void result.current.executeAsync("b").then((r) => settled.push(r));
		});

		await act(async () => {
			g1.resolve();
			g2.resolve();
			await g1.promise;
			await g2.promise;
		});
		await flushHookTimers();

		expect(settled).toEqual([{ data: ["a"] }, { data: ["a", "b"] }]);
	});

	test("resolves, not rejects, on a validation error", async () => {
		const action = vi.fn<TestStateActionFn>(async () => ({ validationErrors: { formErrors: ["nope"] } }));
		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		let settled: unknown;
		await act(async () => {
			settled = await result.current.executeAsync("bad");
		});
		await flushHookTimers();

		expect(settled).toEqual({ validationErrors: { formErrors: ["nope"] } });
		expect(result.current.optimisticState).toEqual(["a"]);
	});

	test("rejects on a navigation error", async () => {
		const navigationError = createRedirectError();
		const action = vi.fn<TestStateActionFn>(async () => {
			throw navigationError;
		});
		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		let rejection: unknown;
		await act(async () => {
			await result.current.executeAsync("b").catch((e) => {
				rejection = e;
			});
		});
		await flushHookTimers();

		expect(rejection).toBe(navigationError);
	});

	test("a mid-flight reset still settles the pending promise", async () => {
		const gate = deferred<void>();
		const action = createAppendAction([gate]);
		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		let settled = false;
		await act(async () => {
			result.current.executeAsync("b").then(
				() => {
					settled = true;
				},
				() => {
					settled = true;
				}
			);
		});
		await act(async () => {
			result.current.reset();
		});
		await act(async () => {
			gate.resolve();
			await gate.promise;
		});
		await flushHookTimers();

		// The dispatch is invisible after the reset, but its promise must never hang.
		expect(settled).toBe(true);
		expect(result.current.optimisticState).toEqual(["a"]);
	});

	test("keeps the resolver queue aligned when formAction and executeAsync interleave", async () => {
		const g1 = deferred<void>();
		const g2 = deferred<void>();
		const action = createAppendAction([g1, g2]);
		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		const scope = deferred<void>();
		await act(async () => {
			React.startTransition(async () => {
				result.current.formAction("f");
				await scope.promise;
			});
		});

		let asyncResult: unknown;
		await act(async () => {
			void result.current.executeAsync("e").then((r) => {
				asyncResult = r;
			});
		});

		expect(result.current.optimisticState).toEqual(["a", "f", "e"]);

		await act(async () => {
			g1.resolve();
			g2.resolve();
			scope.resolve();
			await g1.promise;
			await g2.promise;
		});
		await flushHookTimers();

		// The form dispatch enqueues a `null` entry, so `executeAsync` must not consume the form's
		// result and leave its own promise waiting on the next dispatch.
		expect(asyncResult).toEqual({ data: ["a", "f", "e"] });
	});
});

// ─── Deep queue ──────────────────────────────────────────────────────────────

describe("useOptimisticStateAction deep queue", () => {
	test("three overlapping dispatches fold in order without double-applying", async () => {
		const gates = [deferred<void>(), deferred<void>(), deferred<void>()];
		const action = createAppendAction(gates);
		const { result } = renderHook(() =>
			useOptimisticStateAction(action, { currentState: emptyState, updateFn: appendFn })
		);

		for (const input of ["a", "b", "c"]) {
			await act(async () => {
				result.current.execute(input);
			});
		}

		expect(result.current.optimisticState).toEqual(["a", "b", "c"]);

		for (const gate of gates) {
			await act(async () => {
				gate.resolve();
				await gate.promise;
			});
			await flushHookTimers();
			// Never a double-apply while the rest of the queue drains.
			expect(result.current.optimisticState).toEqual(["a", "b", "c"]);
		}

		expect(action.mock.calls[1]?.[0]).toEqual({ data: ["a"] });
		expect(action.mock.calls[2]?.[0]).toEqual({ data: ["a", "b"] });
		expect(result.current.result.data).toEqual(["a", "b", "c"]);
	});

	test("an action returning no data leaves the previous confirmed state as the base", async () => {
		let call = 0;
		const action = vi.fn<TestStateActionFn>(async (prevResult, input) =>
			call++ === 1 ? {} : { data: [...(prevResult.data ?? []), input] }
		);

		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		for (const input of ["b", "noop", "c"]) {
			await act(async () => {
				result.current.execute(input);
			});
			await flushHookTimers();
		}

		expect(action.mock.calls[2]?.[0]).toEqual({ data: ["a", "b"] });
	});
});

// ─── Option freshness ────────────────────────────────────────────────────────

describe("useOptimisticStateAction option freshness", () => {
	test("a swapped updateFn is used for pending payloads on the next render", async () => {
		const gate = deferred<void>();
		const action = createAppendAction([gate]);
		const { result, rerender } = renderHook(
			({ updateFn }: { updateFn: (state: Item[], input: Item) => Item[] }) =>
				useOptimisticStateAction(action, { currentState: seedA, updateFn }),
			{ initialProps: { updateFn: appendFn } }
		);

		await act(async () => {
			result.current.execute("b");
		});
		expect(result.current.optimisticState).toEqual(["a", "b"]);

		await act(async () => {
			rerender({ updateFn: prependFn });
		});

		// `useOptimistic` replays every pending payload through the reducer of the current render.
		expect(result.current.optimisticState).toEqual(["b", "a"]);

		await act(async () => {
			gate.resolve();
			await gate.promise;
		});
		await flushHookTimers();
	});

	test("a callback swapped mid-flight is the one that fires", async () => {
		const gate = deferred<void>();
		const action = createAppendAction([gate]);
		const first = vi.fn();
		const second = vi.fn();

		const { result, rerender } = renderHook(
			({ onSuccess }: { onSuccess: () => void }) =>
				useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn, onSuccess }),
			{ initialProps: { onSuccess: first } }
		);

		await act(async () => {
			result.current.execute("b");
		});
		await act(async () => {
			rerender({ onSuccess: second });
		});
		await act(async () => {
			gate.resolve();
			await gate.promise;
		});
		await flushHookTimers();

		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
	});
});

// ─── initResult and lifecycle ────────────────────────────────────────────────

describe("useOptimisticStateAction initResult and lifecycle", () => {
	test("reset restores the mount-time initResult and initial state", async () => {
		const action = createAppendAction();
		const initResult = { data: seedA };
		const { result } = renderHook(() =>
			useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn, initResult })
		);

		expect(result.current.result).toEqual(initResult);

		await act(async () => {
			result.current.execute("b");
		});
		await flushHookTimers();
		expect(result.current.result.data).toEqual(["a", "b"]);
		expect(result.current.optimisticState).toEqual(["a", "b"]);

		await act(async () => {
			result.current.reset();
		});
		await flushHookTimers();

		expect(result.current.result).toEqual(initResult);
		expect(result.current.optimisticState).toEqual(["a"]);
		expect(result.current.status).toBe("idle");
		expect(result.current.input).toBeUndefined();
	});

	test("reset masks the pending flag of an in-flight dispatch immediately", async () => {
		const gate = deferred<void>();
		const action = createAppendAction([gate]);
		const { result } = renderHook(() => useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn }));

		await act(async () => {
			result.current.execute("b");
		});
		expect(result.current.isExecuting).toBe(true);

		await act(async () => {
			result.current.reset();
		});

		expect(result.current.isExecuting).toBe(false);
		expect(result.current.isIdle).toBe(true);

		await act(async () => {
			gate.resolve();
			await gate.promise;
		});
		await flushHookTimers();
	});

	test("unmounting mid-flight does not warn or throw", async () => {
		const gate = deferred<void>();
		const action = createAppendAction([gate]);
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		const { result, unmount } = renderHook(() =>
			useOptimisticStateAction(action, { currentState: seedA, updateFn: appendFn })
		);

		await act(async () => {
			result.current.execute("b");
		});

		unmount();

		await act(async () => {
			gate.resolve();
			await gate.promise;
		});
		await flushHookTimers();

		expect(consoleError).not.toHaveBeenCalled();

		consoleError.mockRestore();
	});
});

// ─── Revalidation ordering ───────────────────────────────────────────────────

/**
 * The confirmed value is "the more recent of the action's `data` and `currentState`", and the hook
 * uses ARRIVAL order as its proxy for recency: any new `currentState` identity supersedes the
 * committed result. That proxy only holds while every action that writes the rendered state also
 * revalidates it. When one action revalidates and another does not, the newest payload the page
 * receives can be a snapshot that predates the newest write, and it still wins.
 *
 * These tests pin both halves of that, because the trap is not obvious from the rule alone. It cost
 * a real bug in the playground: `resetItems` revalidated, `moveItem` did not, so `Down -> Reset ->
 * Down` left the UI showing the reset order while the server held the move.
 */
describe("useOptimisticStateAction revalidation ordering", () => {
	test("a currentState that lands after a dispatch commits supersedes that dispatch's data", async () => {
		const action = createAppendAction();
		const { result, rerender } = renderHook(
			({ currentState }: { currentState: Item[] }) =>
				useOptimisticStateAction(action, { currentState, updateFn: appendFn }),
			{ initialProps: { currentState: seedA } }
		);

		await act(async () => {
			result.current.execute("b");
		});
		await flushHookTimers();
		expect(result.current.optimisticState).toEqual(["a", "b"]);
		expect(result.current.result.data).toEqual(["a", "b"]);

		// A payload that does NOT carry "b": it was computed before the write landed, but it arrives
		// after. The hook cannot tell that apart from a genuine revalidation, so the prop wins.
		await act(async () => {
			rerender({ currentState: ["a"] });
		});
		await flushHookTimers();

		expect(result.current.optimisticState).toEqual(["a"]);
		// The envelope still reports what the server actually returned, so the two disagree. That
		// divergence is the symptom to look for when a saved change appears to revert.
		expect(result.current.result.data).toEqual(["a", "b"]);
	});

	test("a revalidated currentState that carries the write keeps it", async () => {
		const action = createAppendAction();
		const { result, rerender } = renderHook(
			({ currentState }: { currentState: Item[] }) =>
				useOptimisticStateAction(action, { currentState, updateFn: appendFn }),
			{ initialProps: { currentState: seedA } }
		);

		await act(async () => {
			result.current.execute("b");
		});
		await flushHookTimers();

		// What an action that revalidates its own write produces: the payload includes "b".
		await act(async () => {
			rerender({ currentState: ["a", "b"] });
		});
		await flushHookTimers();

		expect(result.current.optimisticState).toEqual(["a", "b"]);

		// And the next dispatch builds on it.
		await act(async () => {
			result.current.execute("c");
		});
		await flushHookTimers();

		expect(action.mock.calls[1]?.[0]).toEqual({ data: ["a", "b"] });
		expect(result.current.optimisticState).toEqual(["a", "b", "c"]);
	});

	// The exact playground sequence: Down, Reset (which revalidates), Down again.
	test("a stale payload from a reset undoes the dispatch that follows the reset", async () => {
		const g1 = deferred<void>();
		const g2 = deferred<void>();
		const action = createAppendAction([g1, g2]);
		const { result, rerender } = renderHook(
			({ currentState }: { currentState: Item[] }) =>
				useOptimisticStateAction(action, { currentState, updateFn: appendFn }),
			{ initialProps: { currentState: seedA } }
		);

		await act(async () => {
			result.current.execute("x");
		});
		await act(async () => {
			result.current.reset();
		});
		await act(async () => {
			result.current.execute("y");
		});
		expect(result.current.optimisticState).toEqual(["a", "y"]);

		// The discarded dispatch settles; React withholds the commit while "y" is queued.
		await act(async () => {
			g1.resolve();
			await g1.promise;
		});
		await act(async () => {
			g2.resolve();
			await g2.promise;
		});
		await flushHookTimers();
		expect(result.current.optimisticState).toEqual(["a", "y"]);

		// The reset's revalidation payload arrives last and carries the pre-"y" order.
		await act(async () => {
			rerender({ currentState: ["a"] });
		});
		await flushHookTimers();

		// "y" is gone from view, though the server has it. The fix is on the action side: the write
		// must revalidate, so the last payload to arrive is also the last one written.
		expect(result.current.optimisticState).toEqual(["a"]);
		expect(result.current.result.data).toEqual(["a", "y"]);
	});
});
