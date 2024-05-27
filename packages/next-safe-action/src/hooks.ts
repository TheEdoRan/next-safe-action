"use client";

import type { InferIn, Schema } from "@typeschema/main";
import { isNotFoundError } from "next/dist/client/components/not-found.js";
import { isRedirectError } from "next/dist/client/components/redirect.js";
import * as React from "react";
import {} from "react/experimental";
import type {} from "zod";
import type {
	HookActionStatus,
	HookCallbacks,
	HookResult,
	HookSafeActionFn,
	HookSafeStateActionFn,
} from "./hooks.types";
import { isError } from "./utils";

/**
 * Default value for `result` object returned by `useAction`, `useOptimisticAction` and `useStateAction` hooks.
 */
export const EMPTY_HOOK_RESULT = {
	data: undefined,
	fetchError: undefined,
	serverError: undefined,
	validationErrors: undefined,
} satisfies HookResult<any, any, any, any, any, any>;

const getActionStatus = <
	ServerError,
	S extends Schema | undefined,
	const BAS extends readonly Schema[],
	FVE,
	FBAVE,
	Data,
>({
	isIdle,
	isExecuting,
	result,
}: {
	isIdle: boolean;
	isExecuting: boolean;
	result: HookResult<ServerError, S, BAS, FVE, FBAVE, Data>;
}): HookActionStatus => {
	if (isIdle) {
		return "idle";
	} else if (isExecuting) {
		return "executing";
	} else if (
		typeof result.validationErrors !== "undefined" ||
		typeof result.bindArgsValidationErrors !== "undefined" ||
		typeof result.serverError !== "undefined" ||
		typeof result.fetchError !== "undefined"
	) {
		return "hasErrored";
	} else {
		return "hasSucceeded";
	}
};

const getActionShorthandStatusObject = (status: HookActionStatus) => {
	return {
		isIdle: status === "idle",
		isExecuting: status === "executing",
		hasSucceeded: status === "hasSucceeded",
		hasErrored: status === "hasErrored",
	};
};

const useActionCallbacks = <
	ServerError,
	S extends Schema | undefined,
	const BAS extends readonly Schema[],
	FVE,
	FBAVE,
	Data,
>({
	result,
	input,
	status,
	cb,
}: {
	result: HookResult<ServerError, S, BAS, FVE, FBAVE, Data>;
	input: S extends Schema ? InferIn<S> : undefined;
	status: HookActionStatus;
	cb?: HookCallbacks<ServerError, S, BAS, FVE, FBAVE, Data>;
}) => {
	const onExecuteRef = React.useRef(cb?.onExecute);
	const onSuccessRef = React.useRef(cb?.onSuccess);
	const onErrorRef = React.useRef(cb?.onError);
	const onSettledRef = React.useRef(cb?.onSettled);

	// Execute the callback when the action status changes.
	React.useEffect(() => {
		const onExecute = onExecuteRef.current;
		const onSuccess = onSuccessRef.current;
		const onError = onErrorRef.current;
		const onSettled = onSettledRef.current;

		const executeCallbacks = async () => {
			switch (status) {
				case "executing":
					await Promise.resolve(onExecute?.({ input }));
					break;
				case "hasSucceeded":
					await Promise.resolve(onSuccess?.({ data: result.data!, input }));
					await Promise.resolve(onSettled?.({ result, input }));
					break;
				case "hasErrored":
					await Promise.resolve(onError?.({ error: result, input }));
					await Promise.resolve(onSettled?.({ result, input }));
					break;
			}
		};

		executeCallbacks().catch(console.error);
	}, [status, result, input]);
};

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
	FVE,
	FBAVE,
	Data,
>(
	safeActionFn: HookSafeActionFn<ServerError, S, BAS, FVE, FBAVE, Data>,
	utils?: HookCallbacks<ServerError, S, BAS, FVE, FBAVE, Data>
) => {
	const [, startTransition] = React.useTransition();
	const [result, setResult] = React.useState<HookResult<ServerError, S, BAS, FVE, FBAVE, Data>>(EMPTY_HOOK_RESULT);
	const [clientInput, setClientInput] = React.useState<S extends Schema ? InferIn<S> : void>();
	const [isExecuting, setIsExecuting] = React.useState(false);
	const [isIdle, setIsIdle] = React.useState(true);

	const status = getActionStatus<ServerError, S, BAS, FVE, FBAVE, Data>({ isExecuting, result, isIdle });

	const execute = React.useCallback(
		(input: S extends Schema ? InferIn<S> : void) => {
			setIsIdle(false);
			setClientInput(input);
			setIsExecuting(true);

			return startTransition(() => {
				return safeActionFn(input as S extends Schema ? InferIn<S> : undefined)
					.then((res) => setResult(res ?? EMPTY_HOOK_RESULT))
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
		},
		[safeActionFn]
	);

	const executeAsync = React.useCallback(
		(input: S extends Schema ? InferIn<S> : void) => {
			setIsIdle(false);
			setClientInput(input);
			setIsExecuting(true);

			return new Promise<Awaited<ReturnType<typeof safeActionFn>>>((resolve, reject) => {
				startTransition(() => {
					safeActionFn(input as S extends Schema ? InferIn<S> : undefined)
						.then((res) => {
							setResult(res ?? EMPTY_HOOK_RESULT);
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
		},
		[safeActionFn]
	);

	const reset = () => {
		setIsIdle(true);
		setClientInput(undefined);
		setResult(EMPTY_HOOK_RESULT);
	};

	useActionCallbacks({
		result,
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
	FVE,
	FBAVE,
	Data,
	State,
>(
	safeActionFn: HookSafeActionFn<ServerError, S, BAS, FVE, FBAVE, Data>,
	utils: {
		currentState: State;
		updateFn: (state: State, input: S extends Schema ? InferIn<S> : undefined) => State;
	} & HookCallbacks<ServerError, S, BAS, FVE, FBAVE, Data>
) => {
	const [, startTransition] = React.useTransition();
	const [result, setResult] = React.useState<HookResult<ServerError, S, BAS, FVE, FBAVE, Data>>(EMPTY_HOOK_RESULT);
	const [clientInput, setClientInput] = React.useState<S extends Schema ? InferIn<S> : void>();
	const [isExecuting, setIsExecuting] = React.useState(false);
	const [isIdle, setIsIdle] = React.useState(true);
	const [optimisticState, setOptimisticValue] = React.useOptimistic<State, S extends Schema ? InferIn<S> : undefined>(
		utils.currentState,
		utils.updateFn
	);

	const status = getActionStatus<ServerError, S, BAS, FVE, FBAVE, Data>({ isExecuting, result, isIdle });

	const execute = React.useCallback(
		(input: S extends Schema ? InferIn<S> : void) => {
			setIsIdle(false);
			setClientInput(input);
			setIsExecuting(true);

			return startTransition(() => {
				setOptimisticValue(input as S extends Schema ? InferIn<S> : undefined);
				return safeActionFn(input as S extends Schema ? InferIn<S> : undefined)
					.then((res) => setResult(res ?? EMPTY_HOOK_RESULT))
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
		},
		[safeActionFn, setOptimisticValue]
	);

	const executeAsync = React.useCallback(
		(input: S extends Schema ? InferIn<S> : void) => {
			setIsIdle(false);
			setClientInput(input);
			setIsExecuting(true);

			return new Promise<Awaited<ReturnType<typeof safeActionFn>>>((resolve, reject) => {
				startTransition(() => {
					setOptimisticValue(input as S extends Schema ? InferIn<S> : undefined);
					safeActionFn(input as S extends Schema ? InferIn<S> : undefined)
						.then((res) => {
							setResult(res ?? EMPTY_HOOK_RESULT);
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
		},
		[safeActionFn, setOptimisticValue]
	);

	const reset = () => {
		setIsIdle(true);
		setClientInput(undefined);
		setResult(EMPTY_HOOK_RESULT);
	};

	useActionCallbacks({
		result,
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

/**
 * Use the stateful action from a Client Component via hook. Used for actions defined with [`stateAction`](https://next-safe-action.dev/docs/safe-action-client/instance-methods#action--stateaction).
 * @param safeActionFn The action function
 * @param utils Optional `initResult`, `permalink` and callbacks
 *
 * {@link https://next-safe-action.dev/docs/execution/hooks/usestateaction See docs for more information}
 */
export const useStateAction = <
	ServerError,
	S extends Schema | undefined,
	const BAS extends readonly Schema[],
	FVE,
	FBAVE,
	Data,
>(
	safeActionFn: HookSafeStateActionFn<ServerError, S, BAS, FVE, FBAVE, Data>,
	utils?: {
		initResult?: Awaited<ReturnType<typeof safeActionFn>>;
		permalink?: string;
	} & HookCallbacks<ServerError, S, BAS, FVE, FBAVE, Data>
) => {
	const [result, dispatcher, isExecuting] = React.useActionState(
		safeActionFn,
		utils?.initResult ?? EMPTY_HOOK_RESULT,
		utils?.permalink
	);
	const [isIdle, setIsIdle] = React.useState(true);
	const [clientInput, setClientInput] = React.useState<S extends Schema ? InferIn<S> : void>();
	const status = getActionStatus<ServerError, S, BAS, FVE, FBAVE, Data>({ isExecuting, result, isIdle });

	const execute = React.useCallback(
		(input: S extends Schema ? InferIn<S> : void) => {
			setTimeout(() => {
				setIsIdle(false);
				setClientInput(input);
				dispatcher(input as S extends Schema ? InferIn<S> : undefined);
			}, 0);
		},
		[dispatcher]
	);

	useActionCallbacks({
		result,
		input: clientInput as S extends Schema ? InferIn<S> : undefined,
		status,
		cb: {
			onExecute: utils?.onExecute,
			onSuccess: utils?.onSuccess,
			onError: utils?.onError,
			onSettled: utils?.onSettled,
		},
	});

	return {
		execute,
		input: clientInput,
		result,
		status,
		...getActionShorthandStatusObject(status),
	};
};

export type * from "./hooks.types";
