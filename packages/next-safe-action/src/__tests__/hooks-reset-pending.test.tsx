import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useAction, useOptimisticAction, useStateAction } from "../hooks";
import type { SingleInputActionFn, SingleInputStateActionFn } from "../hooks.types";
import type { SafeActionResult } from "../index.types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type TestResult = SafeActionResult<string, undefined, undefined, { message: string }>;
type TestActionFn = SingleInputActionFn<string, undefined, undefined, { message: string }>;
type TestStateActionFn = SingleInputStateActionFn<string, undefined, undefined, { message: string }>;

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

/** Assert every reported flag reads idle: reset must win over uncancellable React signals. */
function expectReportedIdle(current: {
	status: string;
	isIdle: boolean;
	isExecuting: boolean;
	isPending: boolean;
	hasSucceeded: boolean;
	hasErrored: boolean;
	hasNavigated: boolean;
}) {
	expect(current.status).toBe("idle");
	expect(current.isIdle).toBe(true);
	expect(current.isExecuting).toBe(false);
	expect(current.isPending).toBe(false);
	expect(current.hasSucceeded).toBe(false);
	expect(current.hasErrored).toBe(false);
	expect(current.hasNavigated).toBe(false);
}

function makeCallbackSpies() {
	return {
		onExecute: vi.fn(),
		onSuccess: vi.fn(),
		onError: vi.fn(),
		onSettled: vi.fn(),
		onNavigation: vi.fn(),
	};
}

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

// ─── useAction ───────────────────────────────────────────────────────────────

describe("useAction reset mid-flight reports idle immediately", () => {
	test("flags read idle while the stale call is unsettled and hold after it resolves with data", async () => {
		const resolvers: Array<(value: TestResult) => void> = [];
		const action = vi.fn<TestActionFn>().mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvers.push(resolve);
				})
		);
		const cb = makeCallbackSpies();

		const { result } = renderHook(() => useAction(action, cb));

		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		// Sanity: mid-flight state reads pending before reset.
		expect(result.current.status).toBe("executing");
		expect(result.current.isPending).toBe(true);

		act(() => {
			result.current.reset();
		});

		// Core assertion: idle while the stale call is still unsettled.
		expectReportedIdle(result.current);
		expect(result.current.result).toEqual({});

		// Settle the stale call: nothing may change.
		await act(async () => {
			resolvers[0]!({ data: { message: "stale" } });
		});
		await flushHookTimers();

		expectReportedIdle(result.current);
		expect(result.current.result).toEqual({});
		expect(cb.onExecute).toHaveBeenCalledTimes(1);
		expect(cb.onSuccess).not.toHaveBeenCalled();
		expect(cb.onError).not.toHaveBeenCalled();
		expect(cb.onSettled).not.toHaveBeenCalled();
		expect(cb.onNavigation).not.toHaveBeenCalled();
	});

	test("flags read idle while the stale call is unsettled and hold after it rejects with a plain error", async () => {
		const resolvers: Array<{ resolve: (value: TestResult) => void; reject: (reason: unknown) => void }> = [];
		const action = vi.fn<TestActionFn>().mockImplementation(
			() =>
				new Promise((resolve, reject) => {
					resolvers.push({ resolve, reject });
				})
		);
		const cb = makeCallbackSpies();

		const { result } = renderHook(() => useAction(action, cb));

		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		act(() => {
			result.current.reset();
		});

		expectReportedIdle(result.current);

		await act(async () => {
			resolvers[0]!.reject(new Error("stale failure"));
		});
		await flushHookTimers();

		expectReportedIdle(result.current);
		expect(result.current.result).toEqual({});
		expect(cb.onError).not.toHaveBeenCalled();
		expect(cb.onSettled).not.toHaveBeenCalled();
	});

	test("flags read idle while the stale call is unsettled and hold after it rejects with a redirect error", async () => {
		const resolvers: Array<{ resolve: (value: TestResult) => void; reject: (reason: unknown) => void }> = [];
		const action = vi.fn<TestActionFn>().mockImplementation(
			() =>
				new Promise((resolve, reject) => {
					resolvers.push({ resolve, reject });
				})
		);
		const cb = makeCallbackSpies();

		const { result } = renderHook(() => useAction(action, cb));

		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		act(() => {
			result.current.reset();
		});

		expectReportedIdle(result.current);

		await act(async () => {
			resolvers[0]!.reject(createRedirectError("/dashboard"));
		});
		await flushHookTimers();

		expectReportedIdle(result.current);
		expect(cb.onNavigation).not.toHaveBeenCalled();
		expect(cb.onSettled).not.toHaveBeenCalled();
	});

	test("fresh execute after a mid-flight reset reports executing and lands normally", async () => {
		const resolvers: Array<(value: TestResult) => void> = [];
		const action = vi.fn<TestActionFn>().mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvers.push(resolve);
				})
		);
		const cb = makeCallbackSpies();

		const { result } = renderHook(() => useAction(action, cb));

		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		act(() => {
			result.current.reset();
		});

		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		// The fresh call must report pending: the mask only hides post-reset stale work.
		expect(result.current.status).toBe("executing");
		expect(result.current.isPending).toBe(true);
		expect(result.current.isExecuting).toBe(true);

		// Stale call settles first: still executing the fresh call.
		await act(async () => {
			resolvers[0]!({ data: { message: "stale" } });
		});
		await flushHookTimers();

		expect(result.current.status).toBe("executing");
		expect(result.current.result).toEqual({});

		await act(async () => {
			resolvers[1]!({ data: { message: "fresh" } });
		});
		await flushHookTimers();

		expect(result.current.status).toBe("hasSucceeded");
		expect(result.current.isPending).toBe(false);
		expect(result.current.result).toStrictEqual({ data: { message: "fresh" } });
		expect(cb.onSuccess).toHaveBeenCalledTimes(1);
		expect(cb.onSuccess).toHaveBeenCalledWith({ data: { message: "fresh" }, input: undefined });
		expect(cb.onSettled).toHaveBeenCalledTimes(1);
	});

	test("reset mid-flight restores the initResult baseline with masked flags", async () => {
		const resolvers: Array<(value: TestResult) => void> = [];
		const action = vi.fn<TestActionFn>().mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvers.push(resolve);
				})
		);

		const { result } = renderHook(() => useAction(action, { initResult: { data: { message: "seed" } } }));

		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		act(() => {
			result.current.reset();
		});

		expectReportedIdle(result.current);
		expect(result.current.result).toEqual({ data: { message: "seed" } });

		await act(async () => {
			resolvers[0]!({ data: { message: "stale" } });
		});
		await flushHookTimers();

		expectReportedIdle(result.current);
		expect(result.current.result).toEqual({ data: { message: "seed" } });
	});
});

// ─── useOptimisticAction ─────────────────────────────────────────────────────

describe("useOptimisticAction reset mid-flight reports idle immediately", () => {
	test("flags read idle while the stale call is unsettled and hold after it settles", async () => {
		const resolvers: Array<(value: TestResult) => void> = [];
		const action = vi.fn<TestActionFn>().mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvers.push(resolve);
				})
		);
		const currentState = { count: 0 };

		const { result } = renderHook(() =>
			useOptimisticAction(action, {
				currentState,
				updateFn: (state) => ({ count: state.count + 1 }),
			})
		);

		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		expect(result.current.isPending).toBe(true);

		act(() => {
			result.current.reset();
		});

		expectReportedIdle(result.current);

		await act(async () => {
			resolvers[0]!({ data: { message: "stale" } });
		});
		await flushHookTimers();

		expectReportedIdle(result.current);
		expect(result.current.result).toEqual({});
		expect(result.current.optimisticState).toEqual({ count: 0 });
	});
});

// ─── useStateAction ──────────────────────────────────────────────────────────

describe("useStateAction reset mid-flight reports idle immediately", () => {
	test("flags read idle while the stale dispatch is unsettled and hold after it settles", async () => {
		const resolvers: Array<(value: TestResult) => void> = [];
		const action = vi.fn<TestStateActionFn>(
			() =>
				new Promise<TestResult>((resolve) => {
					resolvers.push(resolve);
				})
		);
		const cb = makeCallbackSpies();

		const { result } = renderHook(() => useStateAction(action, cb));

		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		// Sanity: mid-flight state reads pending before reset.
		expect(result.current.status).toBe("executing");
		expect(result.current.isPending).toBe(true);

		act(() => {
			result.current.reset();
		});

		// Core assertion: `useActionState`'s pending flag can't be cancelled, but the
		// reported flags must read idle while the stale dispatch is still unsettled.
		expectReportedIdle(result.current);
		expect(result.current.result).toEqual({});

		await act(async () => {
			resolvers[0]!({ data: { message: "stale" } });
		});
		await flushHookTimers();

		expectReportedIdle(result.current);
		expect(result.current.result).toEqual({});
		expect(cb.onExecute).toHaveBeenCalledTimes(1);
		expect(cb.onSuccess).not.toHaveBeenCalled();
		expect(cb.onError).not.toHaveBeenCalled();
		expect(cb.onSettled).not.toHaveBeenCalled();
		expect(cb.onNavigation).not.toHaveBeenCalled();
	});

	test("reset mid-flight restores the initResult baseline with masked flags", async () => {
		const resolvers: Array<(value: TestResult) => void> = [];
		const action = vi.fn<TestStateActionFn>(
			() =>
				new Promise<TestResult>((resolve) => {
					resolvers.push(resolve);
				})
		);

		const { result } = renderHook(() => useStateAction(action, { initResult: { data: { message: "seed" } } }));

		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		act(() => {
			result.current.reset();
		});

		expectReportedIdle(result.current);
		expect(result.current.result).toEqual({ data: { message: "seed" } });

		await act(async () => {
			resolvers[0]!({ data: { message: "stale" } });
		});
		await flushHookTimers();

		expectReportedIdle(result.current);
		expect(result.current.result).toEqual({ data: { message: "seed" } });
	});

	test("fresh execute after a mid-flight reset reports executing and lands normally", async () => {
		const resolvers: Array<(value: TestResult) => void> = [];
		const action = vi.fn<TestStateActionFn>(
			() =>
				new Promise<TestResult>((resolve) => {
					resolvers.push(resolve);
				})
		);
		const cb = makeCallbackSpies();

		const { result } = renderHook(() => useStateAction(action, cb));

		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		act(() => {
			result.current.reset();
		});

		expectReportedIdle(result.current);

		// The mask must lift synchronously at dispatch time.
		act(() => {
			result.current.execute(undefined);
		});
		await flushHookTimers();

		expect(result.current.status).toBe("executing");
		expect(result.current.isPending).toBe(true);
		expect(result.current.isExecuting).toBe(true);

		// Stale dispatch settles first (dispatches run sequentially), fresh one still pending.
		await act(async () => {
			resolvers[0]!({ data: { message: "stale" } });
		});
		await flushHookTimers();

		expect(result.current.status).toBe("executing");

		await act(async () => {
			resolvers[1]!({ data: { message: "fresh" } });
		});
		await flushHookTimers();

		expect(result.current.status).toBe("hasSucceeded");
		expect(result.current.isPending).toBe(false);
		expect(result.current.result.data).toEqual({ message: "fresh" });
		expect(cb.onSuccess).toHaveBeenCalledTimes(1);
		expect(cb.onSuccess).toHaveBeenCalledWith({ data: { message: "fresh" }, input: undefined });
	});

	test("formAction dispatch then reset mid-flight reads idle while unsettled", async () => {
		const resolvers: Array<(value: TestResult) => void> = [];
		const action = vi.fn<TestStateActionFn>(
			() =>
				new Promise<TestResult>((resolve) => {
					resolvers.push(resolve);
				})
		);

		const { result } = renderHook(() => useStateAction(action));

		// Mirror real usage: React invokes form actions inside its own transition context.
		act(() => {
			React.startTransition(() => {
				result.current.formAction(undefined as never);
			});
		});
		await flushHookTimers();

		expect(result.current.isPending).toBe(true);

		act(() => {
			result.current.reset();
		});

		expectReportedIdle(result.current);

		await act(async () => {
			resolvers[0]!({ data: { message: "stale" } });
		});
		await flushHookTimers();

		expectReportedIdle(result.current);
		expect(result.current.result).toEqual({});
	});

	test("executeAsync promise from a pre-reset dispatch still settles", async () => {
		const resolvers: Array<(value: TestResult) => void> = [];
		const action = vi.fn<TestStateActionFn>(
			() =>
				new Promise<TestResult>((resolve) => {
					resolvers.push(resolve);
				})
		);

		const { result } = renderHook(() => useStateAction(action));

		let asyncResult: TestResult | undefined;
		act(() => {
			void result.current.executeAsync(undefined).then((r) => {
				asyncResult = r;
			});
		});
		await flushHookTimers();

		act(() => {
			result.current.reset();
		});

		expectReportedIdle(result.current);

		await act(async () => {
			resolvers[0]!({ data: { message: "late" } });
		});
		await flushHookTimers();

		// The caller's promise settles with its own result, while the hook stays idle.
		expect(asyncResult).toEqual({ data: { message: "late" } });
		expectReportedIdle(result.current);
	});
});
