"use client";

import { isNotFoundError } from "next/dist/client/components/not-found.js";
import { isRedirectError } from "next/dist/client/components/redirect.js";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {} from "react/experimental";
import type {} from "zod";
import { getActionShorthandStatusObject, getActionStatus, useActionCallbacks } from "./hooks-utils";
import type { HookCallbacks, HookResult, HookSafeActionFn } from "./hooks.types";
import type { InferIn, Schema } from "./utils";
import { isError } from "./utils";

// HOOKS

/**
 * Use the action from a Client Component via hook.
 * @param safeActionFn The action function
 * @param utils Optional callbacks
 *
 * {@link https://next-safe-action.dev/docs/execution/hooks/useaction See docs for more information}
 */
export const useAction = <
	ServerError,
	S extends Schema | undefined,
	const BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
>(
	safeActionFn: HookSafeActionFn<ServerError, S, BAS, CVE, CBAVE, Data>,
	utils?: HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data>
) => {
	const [, startTransition] = React.useTransition();
	const [result, setResult] = React.useState<HookResult<ServerError, S, BAS, CVE, CBAVE, Data>>({});
	const [clientInput, setClientInput] = React.useState<S extends Schema ? InferIn<S> : void>();
	const [isExecuting, setIsExecuting] = React.useState(false);
	const [isIdle, setIsIdle] = React.useState(true);

	const status = getActionStatus<ServerError, S, BAS, CVE, CBAVE, Data>({ isExecuting, result, isIdle });

	const execute = React.useCallback(
		(input: S extends Schema ? InferIn<S> : void) => {
			startTransition(() => {
				safeActionFn(input as S extends Schema ? InferIn<S> : undefined)
					.then((res) => setResult(res ?? {}))
					.catch((e) => {
						if (isRedirectError(e) || isNotFoundError(e)) {
							throw e;
						}

						setResult({ fetchError: isError(e) ? e.message : "Something went wrong" });
					})
					.finally(() => {
						setIsExecuting(false);
					});
			});

			ReactDOM.flushSync(() => {
				setIsIdle(false);
				setClientInput(input);
				setIsExecuting(true);
			});
		},
		[safeActionFn]
	);

	const executeAsync = React.useCallback(
		(input: S extends Schema ? InferIn<S> : void) => {
			const fn = new Promise<Awaited<ReturnType<typeof safeActionFn>>>((resolve, reject) => {
				startTransition(() => {
					safeActionFn(input as S extends Schema ? InferIn<S> : undefined)
						.then((res) => {
							setResult(res ?? {});
							resolve(res);
						})
						.catch((e) => {
							if (isRedirectError(e) || isNotFoundError(e)) {
								throw e;
							}

							setResult({ fetchError: isError(e) ? e.message : "Something went wrong" });
							reject(e);
						})
						.finally(() => {
							setIsExecuting(false);
						});
				});
			});

			ReactDOM.flushSync(() => {
				setIsIdle(false);
				setClientInput(input);
				setIsExecuting(true);
			});

			return fn;
		},
		[safeActionFn]
	);

	const reset = React.useCallback(() => {
		setIsIdle(true);
		setClientInput(undefined);
		setResult({});
	}, []);

	useActionCallbacks({
		result: result ?? {},
		input: clientInput as S extends Schema ? InferIn<S> : undefined,
		status,
		cb: utils,
	});

	return {
		execute,
		executeAsync,
		input: clientInput,
		result,
		reset,
		status,
		...getActionShorthandStatusObject(status),
	};
};

/**
 * Use the action from a Client Component via hook, with optimistic data update.
 * @param safeActionFn The action function
 * @param utils Required `currentData` and `updateFn` and optional callbacks
 *
 * {@link https://next-safe-action.dev/docs/execution/hooks/useoptimisticaction See docs for more information}
 */
export const useOptimisticAction = <
	ServerError,
	S extends Schema | undefined,
	const BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
	State,
>(
	safeActionFn: HookSafeActionFn<ServerError, S, BAS, CVE, CBAVE, Data>,
	utils: {
		currentState: State;
		updateFn: (state: State, input: S extends Schema ? InferIn<S> : undefined) => State;
	} & HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data>
) => {
	const [, startTransition] = React.useTransition();
	const [result, setResult] = React.useState<HookResult<ServerError, S, BAS, CVE, CBAVE, Data>>({});
	const [clientInput, setClientInput] = React.useState<S extends Schema ? InferIn<S> : void>();
	const [isExecuting, setIsExecuting] = React.useState(false);
	const [isIdle, setIsIdle] = React.useState(true);
	const [optimisticState, setOptimisticValue] = React.useOptimistic<State, S extends Schema ? InferIn<S> : undefined>(
		utils.currentState,
		utils.updateFn
	);

	const status = getActionStatus<ServerError, S, BAS, CVE, CBAVE, Data>({ isExecuting, result, isIdle });

	const execute = React.useCallback(
		(input: S extends Schema ? InferIn<S> : void) => {
			startTransition(() => {
				setOptimisticValue(input as S extends Schema ? InferIn<S> : undefined);
				safeActionFn(input as S extends Schema ? InferIn<S> : undefined)
					.then((res) => setResult(res ?? {}))
					.catch((e) => {
						if (isRedirectError(e) || isNotFoundError(e)) {
							throw e;
						}

						setResult({ fetchError: isError(e) ? e.message : "Something went wrong" });
					})
					.finally(() => {
						setIsExecuting(false);
					});
			});

			ReactDOM.flushSync(() => {
				setIsIdle(false);
				setClientInput(input);
				setIsExecuting(true);
			});
		},
		[safeActionFn, setOptimisticValue]
	);

	const executeAsync = React.useCallback(
		(input: S extends Schema ? InferIn<S> : void) => {
			const fn = new Promise<Awaited<ReturnType<typeof safeActionFn>>>((resolve, reject) => {
				startTransition(() => {
					setOptimisticValue(input as S extends Schema ? InferIn<S> : undefined);
					safeActionFn(input as S extends Schema ? InferIn<S> : undefined)
						.then((res) => {
							setResult(res ?? {});
							resolve(res);
						})
						.catch((e) => {
							if (isRedirectError(e) || isNotFoundError(e)) {
								throw e;
							}

							setResult({ fetchError: isError(e) ? e.message : "Something went wrong" });
							reject(e);
						})
						.finally(() => {
							setIsExecuting(false);
						});
				});
			});

			ReactDOM.flushSync(() => {
				setIsIdle(false);
				setClientInput(input);
				setIsExecuting(true);
			});

			return fn;
		},
		[safeActionFn, setOptimisticValue]
	);

	const reset = React.useCallback(() => {
		setIsIdle(true);
		setClientInput(undefined);
		setResult({});
	}, []);

	useActionCallbacks({
		result: result ?? {},
		input: clientInput as S extends Schema ? InferIn<S> : undefined,
		status,
		cb: {
			onExecute: utils.onExecute,
			onSuccess: utils.onSuccess,
			onError: utils.onError,
			onSettled: utils.onSettled,
		},
	});

	return {
		execute,
		executeAsync,
		input: clientInput,
		result,
		optimisticState,
		reset,
		status,
		...getActionShorthandStatusObject(status),
	};
};

export type * from "./hooks.types";
