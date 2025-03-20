"use client";

import * as React from "react";
import {} from "react/experimental";
import { getActionShorthandStatusObject, getActionStatus, useActionCallbacks } from "./hooks-utils";
import type {
	HookCallbacks,
	HookSafeActionFn,
	UseActionHookReturn,
	UseOptimisticActionHookReturn,
} from "./hooks.types";
import type { SafeActionResult } from "./index.types";
import { FrameworkErrorHandler } from "./next/errors";
import type { InferInputOrDefault, StandardSchemaV1 } from "./standard.types";

// HOOKS

/**
 * Use the action from a Client Component via hook.
 * @param safeActionFn The action function
 * @param cb Optional base utils and callbacks
 *
 * {@link https://next-safe-action.dev/docs/execute-actions/hooks/useaction See docs for more information}
 */
export const useAction = <
	ServerError,
	S extends StandardSchemaV1 | undefined,
	const BAS extends readonly StandardSchemaV1[],
	CVE,
	CBAVE,
	Data,
>(
	safeActionFn: HookSafeActionFn<ServerError, S, BAS, CVE, CBAVE, Data>,
	cb?: HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data>
): UseActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data> => {
	const [isTransitioning, startTransition] = React.useTransition();
	const [result, setResult] = React.useState<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>({});
	const [clientInput, setClientInput] = React.useState<InferInputOrDefault<S, void>>();
	const [isExecuting, setIsExecuting] = React.useState(false);
	const [navigationError, setNavigationError] = React.useState<Error | null>(null);
	const [isIdle, setIsIdle] = React.useState(true);

	const status = getActionStatus<ServerError, S, BAS, CVE, CBAVE, Data>({
		isExecuting,
		result,
		isIdle,
		hasNavigated: navigationError !== null,
	});

	const execute = React.useCallback(
		(input: InferInputOrDefault<S, void>) => {
			setTimeout(() => {
				setIsIdle(false);
				setNavigationError(null);
				setClientInput(input);
				setIsExecuting(true);
			}, 0);

			startTransition(() => {
				safeActionFn(input as InferInputOrDefault<S, undefined>)
					.then((res) => setResult(res ?? {}))
					.catch((e) => {
						setResult({});

						if (FrameworkErrorHandler.isNavigationError(e)) {
							setNavigationError(e);
							return;
						}

						throw e;
					})
					.finally(() => {
						setIsExecuting(false);
					});
			});
		},
		[safeActionFn]
	);

	const executeAsync = React.useCallback(
		(input: InferInputOrDefault<S, void>) => {
			const fn = new Promise<Awaited<ReturnType<typeof safeActionFn>>>((resolve, reject) => {
				setTimeout(() => {
					setIsIdle(false);
					setNavigationError(null);
					setClientInput(input);
					setIsExecuting(true);
				}, 0);

				startTransition(() => {
					safeActionFn(input as InferInputOrDefault<S, undefined>)
						.then((res) => {
							setResult(res ?? {});
							resolve(res);
						})
						.catch((e) => {
							setResult({});

							if (FrameworkErrorHandler.isNavigationError(e)) {
								setNavigationError(e);
								return;
							}

							reject(e);
						})
						.finally(() => {
							setIsExecuting(false);
						});
				});
			});

			return fn;
		},
		[safeActionFn]
	);

	const reset = React.useCallback(() => {
		setIsIdle(true);
		setNavigationError(null);
		setClientInput(undefined);
		setResult({});
	}, []);

	useActionCallbacks({
		result: result ?? {},
		input: clientInput as InferInputOrDefault<S, undefined>,
		status,
		navigationError,
		cb,
	});

	return {
		execute,
		executeAsync,
		input: clientInput as InferInputOrDefault<S, undefined>,
		result,
		reset,
		status,
		...getActionShorthandStatusObject({ status, isTransitioning }),
	};
};

/**
 * Use the action from a Client Component via hook, with optimistic data update.
 * @param safeActionFn The action function
 * @param utils Required `currentData` and `updateFn` and optional base utils and callbacks
 *
 * {@link https://next-safe-action.dev/docs/execute-actions/hooks/useoptimisticaction See docs for more information}
 */
export const useOptimisticAction = <
	ServerError,
	S extends StandardSchemaV1 | undefined,
	const BAS extends readonly StandardSchemaV1[],
	CVE,
	CBAVE,
	Data,
	State,
>(
	safeActionFn: HookSafeActionFn<ServerError, S, BAS, CVE, CBAVE, Data>,
	utils: {
		currentState: State;
		updateFn: (state: State, input: InferInputOrDefault<S, void>) => State;
	} & HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data>
): UseOptimisticActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data, State> => {
	const [isTransitioning, startTransition] = React.useTransition();
	const [result, setResult] = React.useState<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>({});
	const [clientInput, setClientInput] = React.useState<InferInputOrDefault<S, void>>();
	const [isExecuting, setIsExecuting] = React.useState(false);
	const [navigationError, setNavigationError] = React.useState<Error | null>(null);
	const [isIdle, setIsIdle] = React.useState(true);
	const [optimisticState, setOptimisticValue] = React.useOptimistic<State, InferInputOrDefault<S, undefined>>(
		utils.currentState,
		utils.updateFn
	);

	const status = getActionStatus<ServerError, S, BAS, CVE, CBAVE, Data>({
		isExecuting,
		result,
		isIdle,
		hasNavigated: navigationError !== null,
	});

	const execute = React.useCallback(
		(input: InferInputOrDefault<S, void>) => {
			setTimeout(() => {
				setIsIdle(false);
				setClientInput(input);
				setNavigationError(null);
				setIsExecuting(true);
			}, 0);

			startTransition(() => {
				setOptimisticValue(input as InferInputOrDefault<S, undefined>);
				safeActionFn(input as InferInputOrDefault<S, undefined>)
					.then((res) => setResult(res ?? {}))
					.catch((e) => {
						setResult({});

						if (FrameworkErrorHandler.isNavigationError(e)) {
							setNavigationError(e);
							return;
						}

						throw e;
					})
					.finally(() => {
						setIsExecuting(false);
					});
			});
		},
		[safeActionFn, setOptimisticValue]
	);

	const executeAsync = React.useCallback(
		(input: InferInputOrDefault<S, void>) => {
			const fn = new Promise<Awaited<ReturnType<typeof safeActionFn>>>((resolve, reject) => {
				setTimeout(() => {
					setIsIdle(false);
					setClientInput(input);
					setNavigationError(null);
					setIsExecuting(true);
				}, 0);

				startTransition(() => {
					setOptimisticValue(input as InferInputOrDefault<S, undefined>);
					safeActionFn(input as InferInputOrDefault<S, undefined>)
						.then((res) => {
							setResult(res ?? {});
							resolve(res);
						})
						.catch((e) => {
							setResult({});

							if (FrameworkErrorHandler.isNavigationError(e)) {
								setNavigationError(e);
								return;
							}

							reject(e);
						})
						.finally(() => {
							setIsExecuting(false);
						});
				});
			});

			return fn;
		},
		[safeActionFn, setOptimisticValue]
	);

	const reset = React.useCallback(() => {
		setIsIdle(true);
		setClientInput(undefined);
		setNavigationError(null);
		setResult({});
	}, []);

	useActionCallbacks({
		result: result ?? {},
		input: clientInput as InferInputOrDefault<S, undefined>,
		status,
		navigationError,
		cb: {
			onExecute: utils.onExecute,
			onSuccess: utils.onSuccess,
			onError: utils.onError,
			onSettled: utils.onSettled,
			onNavigation: utils.onNavigation,
		},
	});

	return {
		execute,
		executeAsync,
		input: clientInput as InferInputOrDefault<S, undefined>,
		result,
		optimisticState,
		reset,
		status,
		...getActionShorthandStatusObject({ status, isTransitioning }),
	};
};

export type * from "./hooks.types";
