"use client";

import {
	experimental_useOptimistic,
	useCallback,
	useEffect,
	useRef,
	useState,
	useTransition,
} from "react";
import {} from "react/experimental";
import type { z } from "zod";
import type { HookActionStatus, HookCallbacks, HookResult, SafeAction } from "./types";
import { isNextNotFoundError, isNextRedirectError } from "./utils";

// UTILS

const DEFAULT_RESULT: HookResult<z.ZodTypeAny, any> = {
	data: undefined,
	serverError: undefined,
	validationError: undefined,
	fetchError: undefined,
};

const getActionStatus = <const Schema extends z.ZodTypeAny, const Data>(
	isExecuting: boolean,
	result: HookResult<Schema, Data>
): HookActionStatus => {
	if (isExecuting) {
		return "executing";
	} else if (typeof result.data !== "undefined") {
		return "hasSucceeded";
	} else if (
		typeof result.validationError !== "undefined" ||
		typeof result.serverError !== "undefined" ||
		typeof result.fetchError !== "undefined"
	) {
		return "hasErrored";
	}

	return "idle";
};

const useActionCallbacks = <const Schema extends z.ZodTypeAny, const Data>(
	result: HookResult<Schema, Data>,
	input: z.input<Schema>,
	status: HookActionStatus,
	reset: () => void,
	cb?: HookCallbacks<Schema, Data>
) => {
	const onExecuteRef = useRef(cb?.onExecute);
	const onSuccessRef = useRef(cb?.onSuccess);
	const onErrorRef = useRef(cb?.onError);
	const onSettledRef = useRef(cb?.onSettled);

	// Execute the callback on success or error, if provided.
	useEffect(() => {
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

/**
 * Use the action from a Client Component via hook.
 * @param safeAction The typesafe action.
 * @param callbacks Optional callbacks executed when the action succeeds or fails.
 *
 * {@link https://next-safe-action.dev/docs/usage-from-client/hooks/useaction See an example}
 */
export const useAction = <const Schema extends z.ZodTypeAny, const Data>(
	safeAction: SafeAction<Schema, Data>,
	callbacks?: HookCallbacks<Schema, Data>
) => {
	const [, startTransition] = useTransition();
	const executor = useRef(safeAction);
	const [result, setResult] = useState<HookResult<Schema, Data>>(DEFAULT_RESULT);
	const [input, setInput] = useState<z.input<Schema>>();
	const [isExecuting, setIsExecuting] = useState(false);

	const status = getActionStatus<Schema, Data>(isExecuting, result);

	const execute = useCallback((input: z.input<Schema>) => {
		setIsExecuting(true);
		setInput(input);

		return startTransition(() => {
			return executor
				.current(input)
				.then((res) => setResult(res ?? DEFAULT_RESULT))
				.catch((e) => {
					if (isNextRedirectError(e) || isNextNotFoundError(e)) {
						throw e;
					}

					setResult({ fetchError: e });
				})
				.finally(() => {
					setIsExecuting(false);
				});
		});
	}, []);

	const reset = useCallback(() => {
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
 * @param callbacks Optional callbacks executed when the action succeeds or fails.
 *
 * {@link https://next-safe-action.dev/docs/usage-from-client/hooks/useoptimisticaction See an example}
 */
export const useOptimisticAction = <const Schema extends z.ZodTypeAny, const Data>(
	safeAction: SafeAction<Schema, Data>,
	initialOptimisticData: Data,
	reducer: (state: Data, input: z.input<Schema>) => Data,
	callbacks?: HookCallbacks<Schema, Data>
) => {
	const [result, setResult] = useState<HookResult<Schema, Data>>(DEFAULT_RESULT);
	const [input, setInput] = useState<z.input<Schema>>();

	const [optimisticData, setOptimisticState] = experimental_useOptimistic<Data, z.input<Schema>>(
		initialOptimisticData,
		reducer
	);

	const [isExecuting, setIsExecuting] = useState(false);

	const executor = useRef(safeAction);

	const status = getActionStatus<Schema, Data>(isExecuting, result);

	const execute = useCallback(
		(input: z.input<Schema>) => {
			setIsExecuting(true);
			setOptimisticState(input);
			setInput(input);

			return executor
				.current(input)
				.then((res) => setResult(res ?? DEFAULT_RESULT))
				.catch((e) => {
					if (isNextRedirectError(e) || isNextNotFoundError(e)) {
						throw e;
					}

					setResult({ fetchError: e });
				})
				.finally(() => {
					setIsExecuting(false);
				});
		},
		[setOptimisticState]
	);

	const reset = useCallback(() => {
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

export type { HookActionStatus, HookCallbacks, HookResult };
