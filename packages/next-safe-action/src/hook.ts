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

const getActionStatus = <const Schema extends z.ZodTypeAny, const Data>(
	isExecuting: boolean,
	result: HookResult<Schema, Data>
): HookActionStatus => {
	if (isExecuting) {
		return "executing";
	} else if (typeof result.data !== "undefined") {
		return "hasSucceded";
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

	// Execute the callback on success or error, if provided.
	useEffect(() => {
		const onExecute = onExecuteRef.current;
		const onSuccess = onSuccessRef.current;
		const onError = onErrorRef.current;

		const executeCallbacks = async () => {
			switch (status) {
				case "executing":
					await Promise.resolve(onExecute?.(input));
					break;
				case "hasSucceded":
					await Promise.resolve(onSuccess?.(result.data!, input, reset));
					break;
				case "hasErrored":
					await Promise.resolve(onError?.(result, input, reset));
					break;
			}
		};

		executeCallbacks().catch(console.error);
	}, [status, result, reset, input]);
};

/**
 * Use the action from a Client Component via hook.
 * @param safeAction The typesafe action.
 * @param cb Optional callbacks executed when the action succeeds or fails.
 *
 * {@link https://github.com/TheEdoRan/next-safe-action/tree/main/packages/next-safe-action#2-the-hook-way See an example}
 */
export const useAction = <const Schema extends z.ZodTypeAny, const Data>(
	safeAction: SafeAction<Schema, Data>,
	cb?: HookCallbacks<Schema, Data>
) => {
	const [, startTransition] = useTransition();
	const executor = useRef(safeAction);
	const [result, setResult] = useState<HookResult<Schema, Data>>({});
	const [input, setInput] = useState<z.input<Schema>>();
	const [isExecuting, setIsExecuting] = useState(false);

	const status = getActionStatus<Schema, Data>(isExecuting, result);

	const execute = useCallback((input: z.input<Schema>) => {
		setIsExecuting(true);
		setInput(input);

		return startTransition(() => {
			return executor
				.current(input)
				.then((res) => setResult(res))
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
		setResult({});
	}, []);

	useActionCallbacks(result, input, status, reset, cb);

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
 * @param initialOptData Initial optimistic data.
 * @param cb Optional callbacks executed when the action succeeds or fails.
 *
 * {@link https://github.com/TheEdoRan/next-safe-action/tree/main/packages/next-safe-action#optimistic-update--experimental See an example}
 */
export const useOptimisticAction = <const Schema extends z.ZodTypeAny, const Data>(
	safeAction: SafeAction<Schema, Data>,
	initialOptData: Data,
	reducer: (state: Data, action: z.input<Schema>) => Data,
	cb?: HookCallbacks<Schema, Data>
) => {
	const [result, setResult] = useState<HookResult<Schema, Data>>({});
	const [input, setInput] = useState<z.input<Schema>>();

	const [optimisticData, syncState] = experimental_useOptimistic<Data, z.input<Schema>>(
		initialOptData,
		reducer
	);

	const [isExecuting, setIsExecuting] = useState(false);

	const executor = useRef(safeAction);

	const status = getActionStatus<Schema, Data>(isExecuting, result);

	const execute = useCallback(
		(input: z.input<Schema>) => {
			setIsExecuting(true);
			syncState(input);
			setInput(input);

			return executor
				.current(input)
				.then((res) => setResult(res))
				.catch((e) => {
					// NOTE: this doesn't work at the moment.
					if (isNextRedirectError(e) || isNextNotFoundError(e)) {
						throw e;
					}

					setResult({ fetchError: e });
				})
				.finally(() => {
					setIsExecuting(false);
				});
		},
		[syncState]
	);

	const reset = useCallback(() => {
		setResult({});
	}, []);

	useActionCallbacks(result, input, status, reset, cb);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars

	return {
		execute,
		result,
		optimisticData,
		reset,
		status,
	};
};

export type { HookActionStatus, HookCallbacks, HookResult };
