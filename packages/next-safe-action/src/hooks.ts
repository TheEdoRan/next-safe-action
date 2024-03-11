"use client";

import type { InferIn, Schema } from "@typeschema/main";
import { isNotFoundError } from "next/dist/client/components/not-found.js";
import { isRedirectError } from "next/dist/client/components/redirect.js";
import * as React from "react";
import {} from "react/experimental";
import type { SafeAction } from ".";
import type { MaybePromise } from "./utils";
import { isError } from "./utils";

// TYPES

/**
 * Type of `result` object returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookResult<S extends Schema, Data> = Awaited<ReturnType<SafeAction<S, Data>>> & {
	fetchError?: string;
};

/**
 * Type of hooks callbacks. These are executed when action is in a specific state.
 */
export type HookCallbacks<S extends Schema, Data> = {
	onExecute?: (input: InferIn<S>) => MaybePromise<void>;
	onSuccess?: (data: Data, input: InferIn<S>, reset: () => void) => MaybePromise<void>;
	onError?: (
		error: Omit<HookResult<S, Data>, "data">,
		input: InferIn<S>,
		reset: () => void
	) => MaybePromise<void>;
	onSettled?: (
		result: HookResult<S, Data>,
		input: InferIn<S>,
		reset: () => void
	) => MaybePromise<void>;
};

/**
 * Type of the action status returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookActionStatus = "idle" | "executing" | "hasSucceeded" | "hasErrored";

// UTILS

const DEFAULT_RESULT = {
	data: undefined,
	fetchError: undefined,
	serverError: undefined,
	validationErrors: undefined,
} satisfies HookResult<any, any>;

const getActionStatus = <const S extends Schema, const Data>(
	isExecuting: boolean,
	result: HookResult<S, Data>
): HookActionStatus => {
	if (isExecuting) {
		return "executing";
	} else if (typeof result.data !== "undefined") {
		return "hasSucceeded";
	} else if (
		typeof result.validationErrors !== "undefined" ||
		typeof result.serverError !== "undefined" ||
		typeof result.fetchError !== "undefined"
	) {
		return "hasErrored";
	}

	return "idle";
};

const useActionCallbacks = <const S extends Schema, const Data>(
	result: HookResult<S, Data>,
	input: InferIn<S>,
	status: HookActionStatus,
	reset: () => void,
	cb?: HookCallbacks<S, Data>
) => {
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
					await Promise.resolve(onExecute?.(input));
					break;
				case "hasSucceeded":
					await Promise.resolve(onSuccess?.(result.data!, input, reset));
					await Promise.resolve(onSettled?.(result, input, reset));
					break;
				case "hasErrored":
					await Promise.resolve(onError?.(result, input, reset));
					await Promise.resolve(onSettled?.(result, input, reset));
					break;
			}
		};

		executeCallbacks().catch(console.error);
	}, [status, result, reset, input]);
};

// HOOKS

/**
 * Use the action from a Client Component via hook.
 * @param safeAction The typesafe action.
 * @param callbacks Optional callbacks executed based on the action status.
 *
 * {@link https://next-safe-action.dev/docs/usage/client-components/hooks/useaction See an example}
 */
export const useAction = <const S extends Schema, const Data>(
	safeAction: SafeAction<S, Data>,
	callbacks?: HookCallbacks<S, Data>
) => {
	const [, startTransition] = React.useTransition();
	const [result, setResult] = React.useState<HookResult<S, Data>>(DEFAULT_RESULT);
	const [input, setInput] = React.useState<InferIn<S>>();
	const [isExecuting, setIsExecuting] = React.useState(false);

	const status = getActionStatus<S, Data>(isExecuting, result);

	const execute = React.useCallback(
		(input: InferIn<S>) => {
			setInput(input);
			setIsExecuting(true);

			return startTransition(() => {
				return safeAction(input)
					.then((res) => setResult(res ?? DEFAULT_RESULT))
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
		[safeAction]
	);

	const reset = React.useCallback(() => {
		setResult(DEFAULT_RESULT);
	}, []);

	useActionCallbacks(result, input, status, reset, callbacks);

	return {
		execute,
		result,
		reset,
		status,
	};
};

/**
 * Use the action from a Client Component via hook, with optimistic data update.
 *
 * **NOTE: This hook uses an experimental React feature.**
 * @param safeAction The typesafe action.
 * @param initialOptimisticData Initial optimistic data.
 * @param reducer Optimistic state reducer.
 * @param callbacks Optional callbacks executed based on the action status.
 *
 * {@link https://next-safe-action.dev/docs/usage/client-components/hooks/useoptimisticaction See an example}
 */
export const useOptimisticAction = <const S extends Schema, const Data>(
	safeAction: SafeAction<S, Data>,
	initialOptimisticData: Data,
	reducer: (state: Data, input: InferIn<S>) => Data,
	callbacks?: HookCallbacks<S, Data>
) => {
	const [, startTransition] = React.useTransition();
	const [result, setResult] = React.useState<HookResult<S, Data>>(DEFAULT_RESULT);
	const [input, setInput] = React.useState<InferIn<S>>();
	const [isExecuting, setIsExecuting] = React.useState(false);

	const [optimisticData, setOptimisticState] = React.useOptimistic<Data, InferIn<S>>(
		initialOptimisticData,
		reducer
	);

	const status = getActionStatus<S, Data>(isExecuting, result);

	const execute = React.useCallback(
		(input: InferIn<S>) => {
			setInput(input);
			setIsExecuting(true);

			return startTransition(() => {
				setOptimisticState(input);
				return safeAction(input)
					.then((res) => setResult(res ?? DEFAULT_RESULT))
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
		[setOptimisticState, safeAction]
	);

	const reset = React.useCallback(() => {
		setResult(DEFAULT_RESULT);
	}, []);

	useActionCallbacks(result, input, status, reset, callbacks);

	return {
		execute,
		result,
		optimisticData,
		reset,
		status,
	};
};
