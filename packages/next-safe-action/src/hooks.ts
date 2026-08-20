"use client";

import * as React from "react";
import { useActionBase } from "./hooks-shared";
import { getActionShorthandStatusObject, getActionStatus, useActionCallbacks } from "./hooks-utils";
import type {
	HookBaseOptions,
	HookCallbacks,
	HookIdleResult,
	SingleInputActionFn,
	SingleInputStateActionFn,
	UseActionHookReturn,
	UseOptimisticActionHookReturn,
	UseStateActionHookReturn,
} from "./hooks.types";
import type { NormalizeActionResult, SafeActionResult } from "./index.types";
import { FrameworkErrorHandler } from "./next/errors";
import type { InferInputOrDefault, StandardSchemaV1 } from "./standard-schema";

// HOOKS

/**
 * Use the action from a Client Component via hook.
 * @param safeActionFn The action function
 * @param opts Optional configuration: `initResult` for initial state, plus callbacks
 *
 * {@link https://next-safe-action.dev/docs/execute-actions/hooks/useaction See docs for more information}
 */
export const useAction = <
	ServerError,
	Schema extends StandardSchemaV1 | undefined,
	ShapedErrors,
	Data,
	InitR extends SafeActionResult<ServerError, Schema, ShapedErrors, Data> = HookIdleResult,
>(
	safeActionFn: SingleInputActionFn<ServerError, Schema, ShapedErrors, Data>,
	opts?: {
		initResult?: InitR;
	} & HookBaseOptions<ServerError, Schema, ShapedErrors, Data>
): UseActionHookReturn<ServerError, Schema, ShapedErrors, Data, InitR> => {
	const { result, clientInput, status, execute, executeAsync, reset, shorthandStatus } = useActionBase(
		safeActionFn,
		opts
	);

	// Cast rationale: the return object's runtime values are guaranteed consistent
	// by `getActionStatus` + `getActionShorthandStatusObject`, but TypeScript can't
	// verify that the widened types (e.g. `status: HookActionStatus`) satisfy a
	// specific branch of the discriminated union. The cast is safe and isolated here.
	return {
		execute,
		executeAsync,
		input: clientInput as InferInputOrDefault<Schema, undefined>,
		result,
		reset,
		status,
		...shorthandStatus,
	} as UseActionHookReturn<ServerError, Schema, ShapedErrors, Data, InitR>;
};

/**
 * Use the action from a Client Component via hook, with optimistic data update.
 * @param safeActionFn The action function
 * @param utils Required `currentData` and `updateFn`, optional `initResult` for initial state, and optional callbacks
 *
 * {@link https://next-safe-action.dev/docs/execute-actions/hooks/useoptimisticaction See docs for more information}
 */
export const useOptimisticAction = <
	ServerError,
	Schema extends StandardSchemaV1 | undefined,
	ShapedErrors,
	Data,
	State,
	InitR extends SafeActionResult<ServerError, Schema, ShapedErrors, Data> = HookIdleResult,
>(
	safeActionFn: SingleInputActionFn<ServerError, Schema, ShapedErrors, Data>,
	utils: {
		currentState: State;
		updateFn: (state: State, input: InferInputOrDefault<Schema, void>) => State;
		initResult?: InitR;
	} & HookBaseOptions<ServerError, Schema, ShapedErrors, Data>
): UseOptimisticActionHookReturn<ServerError, Schema, ShapedErrors, Data, State, InitR> => {
	const [optimisticState, setOptimisticValue] = React.useOptimistic<State, InferInputOrDefault<Schema, undefined>>(
		utils.currentState,
		utils.updateFn
	);

	// Extract hook options from utils, excluding the useOptimisticAction-specific properties.
	const { currentState: _, updateFn: __, ...hookOpts } = utils;

	const { result, clientInput, status, execute, executeAsync, reset, shorthandStatus } = useActionBase(
		safeActionFn,
		hookOpts as HookBaseOptions<ServerError, Schema, ShapedErrors, Data>,
		setOptimisticValue
	);

	// Cast rationale: same as `useAction` — runtime consistency guaranteed by
	// `getActionStatus` + `getActionShorthandStatusObject`. The double assertion
	// is needed because TypeScript can't verify overlap between the widened object
	// and the distributed intersection-over-union (`UseActionHookReturn & { optimisticState }`).
	return {
		execute,
		executeAsync,
		input: clientInput as InferInputOrDefault<Schema, undefined>,
		result,
		optimisticState,
		reset,
		status,
		...shorthandStatus,
	} as unknown as UseOptimisticActionHookReturn<ServerError, Schema, ShapedErrors, Data, State, InitR>;
};

/**
 * Use the stateful action from a Client Component via hook. Used for actions defined with
 * [`stateAction`](https://next-safe-action.dev/docs/define-actions/instance-methods#action--stateaction).
 *
 * Provides full lifecycle control: callbacks, status tracking, navigation error handling,
 * `executeAsync`, `reset`, and `formAction` for `<form action={formAction}>` integration.
 *
 * Requires React 19+ (Next.js 15+). On older versions, a runtime error is thrown with guidance.
 *
 * @param safeActionFn The stateful action function created with `.stateAction()`.
 * @param opts Optional configuration: `initResult` for initial state, plus all hook options and callbacks.
 *
 * {@link https://next-safe-action.dev/docs/execute-actions/hooks/usestateaction See docs for more information}
 */
export const useStateAction = <
	ServerError,
	Schema extends StandardSchemaV1 | undefined,
	ShapedErrors,
	Data,
	InitR extends SafeActionResult<ServerError, Schema, ShapedErrors, Data> = HookIdleResult,
>(
	safeActionFn: SingleInputStateActionFn<ServerError, Schema, ShapedErrors, Data>,
	opts?: {
		initResult?: InitR;
	} & HookBaseOptions<ServerError, Schema, ShapedErrors, Data>
): UseStateActionHookReturn<ServerError, Schema, ShapedErrors, Data, InitR> => {
	if (typeof React.useActionState !== "function") {
		throw new Error(
			"useStateAction requires React 19+ (Next.js 15+). " +
				"For older versions, use React's useActionState directly with your safe action."
		);
	}

	// ─── Refs ────────────────────────────────────────────────────────────

	// `initResult` is captured once at mount, mirroring React's `useActionState` initialState:
	// later changes to the option are ignored, and `reset` restores this baseline.
	const initResultRef = React.useRef<SafeActionResult<ServerError, Schema, ShapedErrors, Data>>(opts?.initResult ?? {});

	// FIFO queue aligned with dispatch order: `useActionState` runs queued actions sequentially,
	// and every dispatch path enqueues exactly one entry (a resolver for `executeAsync`, `null`
	// for `execute`/`formAction`), so `wrappedAction` settles the right promise by shifting one
	// entry per invocation. A single slot would be overwritten by overlapping `executeAsync`
	// calls, leaving the first promise unsettled. Each entry also records the reset generation
	// at dispatch time, so dispatches enqueued before a `reset` are detected as stale.
	const asyncResolversRef = React.useRef<
		Array<{
			resolver: {
				resolve: (value: unknown) => void;
				reject: (reason: unknown) => void;
			} | null;
			generation: number;
		}>
	>([]);
	const prevResultOverrideRef = React.useRef<SafeActionResult<ServerError, Schema, ShapedErrors, Data> | null>(null);
	// Incremented on every `reset`: dispatches carrying an older generation must not clear the
	// reset state nor consume the reset baseline (`useActionState` dispatches can't be cancelled).
	const resetGenerationRef = React.useRef(0);
	// Bumped once per dispatch, so each dispatch can be told apart from the commits it produces.
	const dispatchIdRef = React.useRef(0);

	// ─── State ────────────────────────────────────────────────────────────

	const [navigationError, setNavigationError] = React.useState<Error | null>(null);
	const [thrownError, setThrownError] = React.useState<Error | null>(null);
	const [isIdle, setIsIdle] = React.useState(true);
	const [isReset, setIsReset] = React.useState(false);
	// Identifies the dispatch the committed state belongs to; `0` means none yet. Set inside the
	// dispatch-time batch so it can never advance ahead of the state it describes.
	const [executionId, setExecutionId] = React.useState(0);
	const [clientInput, setClientInput] = React.useState<InferInputOrDefault<Schema, void>>();
	const [isTransitioning, startTransition] = React.useTransition();

	// Shared dispatch-time state initialization: every dispatch path (`execute`,
	// `executeAsync`, `formAction`) runs this before enqueueing its action, so the
	// visible state always reflects the latest dispatched input.
	//
	// Applied twice, on purpose. The synchronous call is what normally commits. A dispatch
	// made inside an ambient React transition (`<form action={formAction}>`, where React sets
	// its internal current transition before calling the action) puts these updates on the
	// transition lane instead, and Next's router suspends on that same lane while it awaits
	// the RSC response: nothing commits until the action settles. `isReset` staying true then
	// keeps `isExecutingMasked` false, so the whole dispatch after a `reset` reports idle.
	//
	// A microtask runs after React restores the current transition in `startTransition`'s
	// `finally`, so the repeat lands on the default lane and commits right away. Outside a
	// transition it is an eager bailout: same values, no extra render.
	const beginDispatch = React.useCallback((input: InferInputOrDefault<Schema, void>) => {
		const generation = resetGenerationRef.current;
		const dispatchId = ++dispatchIdRef.current;

		const apply = () => {
			setIsIdle(false);
			setIsReset(false);
			setNavigationError(null);
			setThrownError(null);
			setClientInput(input);
			setExecutionId(dispatchId);
		};

		apply();

		queueMicrotask(() => {
			// A `reset` landed in between: its state must win.
			if (generation !== resetGenerationRef.current) return;
			apply();
		});
	}, []);

	// ─── Wrapper function ─────────────────────────────────────────────────
	// State updates inside the wrapper are batched into the transition by React,
	// so they commit atomically with the result. This prevents the double-fire issue
	// that would occur if state were synced via a separate effect.

	const wrappedAction = React.useCallback(
		async (
			prevResult: SafeActionResult<ServerError, Schema, ShapedErrors, Data>,
			input: InferInputOrDefault<Schema, undefined>
		): Promise<SafeActionResult<ServerError, Schema, ShapedErrors, Data>> => {
			// One dispatch = one queue entry, consumed here in dispatch order.
			const entry = asyncResolversRef.current.shift();
			const asyncResolver = entry?.resolver ?? null;
			const dispatchGeneration = entry?.generation ?? resetGenerationRef.current;
			// Re-evaluated at each use: a `reset` can land while this action is awaited.
			const staleAfterReset = () => dispatchGeneration !== resetGenerationRef.current;

			const effectivePrevResult = staleAfterReset() ? prevResult : (prevResultOverrideRef.current ?? prevResult);
			if (!staleAfterReset()) {
				prevResultOverrideRef.current = null;
			}

			try {
				// Never store `undefined`, mirroring `useActionBase`'s `setResult(res ?? {})`. The
				// render-time `rawResult ?? {}` below would otherwise allocate a fresh object on every
				// render, and `useActionCallbacks` compares result identity to tell a new execution
				// from a replay, so `onSuccess`/`onSettled` would re-fire on every unrelated re-render.
				const result = (await safeActionFn(effectivePrevResult, input)) ?? {};
				asyncResolver?.resolve(result);
				return result;
			} catch (e) {
				if (FrameworkErrorHandler.isNavigationError(e)) {
					if (!staleAfterReset()) {
						setNavigationError(e);
					}
					asyncResolver?.reject(e);
					return {};
				}

				if (!staleAfterReset()) {
					setThrownError(e as Error);
				}
				asyncResolver?.reject(e);
				throw e;
			}
		},
		[safeActionFn]
	);

	// ─── Core useActionState ──────────────────────────────────────────────

	const [rawResult, dispatcher, isExecuting] = React.useActionState(wrappedAction, initResultRef.current);

	// ─── execute ──────────────────────────────────────────────────────────

	const dispatchWithResolver = React.useCallback(
		(
			input: InferInputOrDefault<Schema, void>,
			asyncResolver: { resolve: (value: unknown) => void; reject: (reason: unknown) => void } | null
		) => {
			beginDispatch(input);

			startTransition(() => {
				asyncResolversRef.current.push({ resolver: asyncResolver, generation: resetGenerationRef.current });
				dispatcher(input as InferInputOrDefault<Schema, undefined>);
			});
		},
		[beginDispatch, dispatcher]
	);

	const execute = React.useCallback(
		(input: InferInputOrDefault<Schema, void>) => {
			dispatchWithResolver(input, null);
		},
		[dispatchWithResolver]
	);

	// ─── executeAsync ─────────────────────────────────────────────────────

	const executeAsync = React.useCallback(
		(input: InferInputOrDefault<Schema, void>) => {
			return new Promise<SafeActionResult<ServerError, Schema, ShapedErrors, Data>>((resolve, reject) => {
				dispatchWithResolver(input, {
					resolve: resolve as (value: unknown) => void,
					reject,
				});
			});
		},
		[dispatchWithResolver]
	);

	// ─── formAction ───────────────────────────────────────────────────────

	// Wraps the dispatcher so form dispatches also initialize state at dispatch time and
	// enqueue their (null) entry, keeping the resolver queue aligned with dispatch order
	// when `formAction` and `executeAsync` interleave. React invokes form actions inside its
	// own transition, which is exactly the case `beginDispatch`'s microtask repeat covers.
	const formAction = React.useCallback(
		(input: InferInputOrDefault<Schema, undefined>) => {
			beginDispatch(input as InferInputOrDefault<Schema, void>);
			asyncResolversRef.current.push({ resolver: null, generation: resetGenerationRef.current });
			dispatcher(input);
		},
		[beginDispatch, dispatcher]
	);

	// ─── reset ────────────────────────────────────────────────────────────

	const reset = React.useCallback(() => {
		// Mark every dispatch enqueued so far as stale (see `resetGenerationRef`).
		const generation = ++resetGenerationRef.current;
		prevResultOverrideRef.current = initResultRef.current;

		const apply = () => {
			setIsIdle(true);
			setIsReset(true);
			setNavigationError(null);
			setThrownError(null);
			setClientInput(undefined);
		};

		// Same two-step dispatch as `beginDispatch`: a `reset` called from inside an ambient
		// transition would otherwise be withheld for as long as a dispatch is.
		apply();

		queueMicrotask(() => {
			// A newer `reset` landed in between: its state must win. A dispatch enqueued after
			// this reset keeps the same generation, and its own microtask runs after this one.
			if (generation !== resetGenerationRef.current) return;
			apply();
		});
	}, []);

	// ─── Status ───────────────────────────────────────────────────────────

	// On reset, the visible `result` is restored to the mount-captured `initResult` (or `{}` when
	// not provided) so the idle branch's runtime value matches its declared type in both phases:
	// at mount and after reset. This is also the intuitive contract for `reset`: return to the
	// initial state.
	const result = isReset ? initResultRef.current : (rawResult ?? {});

	// `useActionState`'s pending flag can't be cancelled: after a mid-flight `reset` it stays
	// true until the stale dispatch settles. Mask it with `isReset` so the reported status reads
	// idle immediately; the mask lifts on the next dispatch (`beginDispatch`).
	const isExecutingMasked = isExecuting && !isReset;

	const status = getActionStatus<ServerError, Schema, ShapedErrors, Data>({
		isExecuting: isExecutingMasked,
		result,
		isIdle: isIdle && !isExecutingMasked,
		hasNavigated: navigationError !== null,
		hasThrownError: thrownError !== null,
	});

	// ─── Callbacks ────────────────────────────────────────────────────────

	useActionCallbacks({
		result,
		input: clientInput as InferInputOrDefault<Schema, undefined>,
		status,
		executionId,
		cb: opts as HookCallbacks<ServerError, Schema, ShapedErrors, Data> | undefined,
		throwOnNavigation: opts?.throwOnNavigation === true,
		navigationError,
		thrownError,
	});

	if (opts?.throwOnNavigation === true && navigationError !== null) {
		throw navigationError;
	}

	// ─── Return ───────────────────────────────────────────────────────────

	// Cast rationale: same as `useAction` — runtime consistency guaranteed by
	// `getActionStatus` + `getActionShorthandStatusObject`. The double assertion
	// through `unknown` is needed because TypeScript can't verify overlap between
	// the widened object and the distributed intersection-over-union.
	return {
		execute,
		executeAsync: executeAsync as unknown as (
			input: InferInputOrDefault<Schema, void>
		) => Promise<NormalizeActionResult<SafeActionResult<ServerError, Schema, ShapedErrors, Data>>>,
		formAction: formAction as (input: InferInputOrDefault<Schema, void>) => void,
		input: clientInput as InferInputOrDefault<Schema, undefined>,
		result: result as unknown as NormalizeActionResult<SafeActionResult<ServerError, Schema, ShapedErrors, Data>>,
		reset,
		status,
		...getActionShorthandStatusObject({ status, isTransitioning }),
	} as unknown as UseStateActionHookReturn<ServerError, Schema, ShapedErrors, Data, InitR>;
};

export type * from "./hooks.types";
