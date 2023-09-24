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
import type { ClientCaller, HookCallbacks, HookResponse } from "./types";
import { isNextNotFoundError, isNextRedirectError } from "./utils";

// UTILS

const getActionStatus = <const IV extends z.ZodTypeAny, const Data>(
	response: HookResponse<IV, Data>
) => {
	const hasSucceded = typeof response.data !== "undefined";
	const hasErrored =
		typeof response.validationError !== "undefined" ||
		typeof response.serverError !== "undefined" ||
		typeof response.fetchError !== "undefined";

	const hasExecuted = hasSucceded || hasErrored;

	return { hasExecuted, hasSucceded, hasErrored };
};

const useActionCallbacks = <const IV extends z.ZodTypeAny, const Data>(
	response: HookResponse<IV, Data>,
	input: z.input<IV>,
	hasSucceded: boolean,
	hasErrored: boolean,
	reset: () => void,
	cb?: HookCallbacks<IV, Data>
) => {
	const onSuccessRef = useRef(cb?.onSuccess);
	const onErrorRef = useRef(cb?.onError);

	// Execute the callback on success or error, if provided.
	useEffect(() => {
		const onSuccess = onSuccessRef.current;
		const onError = onErrorRef.current;

		if (onSuccess && hasSucceded) {
			onSuccess(response.data!, input, reset);
		} else if (onError && hasErrored) {
			onError(response, input, reset);
		}
	}, [hasErrored, hasSucceded, response, reset]);
};

/**
 * Use the action from a Client Component via hook.
 * @param clientCaller Caller function with typesafe input data for the Server Action.
 * @param cb Optional callbacks executed when the action succeeds or fails.
 *
 * {@link https://github.com/TheEdoRan/next-safe-action/tree/main/packages/next-safe-action#2-the-hook-way See an example}
 */
export const useAction = <const IV extends z.ZodTypeAny, const Data>(
	clientCaller: ClientCaller<IV, Data>,
	cb?: HookCallbacks<IV, Data>
) => {
	const [isExecuting, startTransition] = useTransition();
	const executor = useRef(clientCaller);
	const [response, setResponse] = useState<HookResponse<IV, Data>>({});
	const [input, setInput] = useState<z.input<IV>>();

	const { hasExecuted, hasSucceded, hasErrored } = getActionStatus<IV, Data>(response);

	const execute = useCallback((input: z.input<IV>) => {
		setInput(input);

		return startTransition(() => {
			return executor
				.current(input)
				.then((response) => setResponse(response))
				.catch((e) => {
					if (isNextRedirectError(e) || isNextNotFoundError(e)) {
						throw e;
					}

					setResponse({ fetchError: e });
				});
		});
	}, []);

	const reset = useCallback(() => {
		setResponse({});
	}, []);

	useActionCallbacks(response, input, hasSucceded, hasErrored, reset, cb);

	return {
		execute,
		isExecuting,
		response,
		reset,
		hasExecuted,
		hasSucceded,
		hasErrored,
	};
};

/**
 * Use the action from a Client Component via hook, with optimistic data update.
 *
 * **NOTE: This hook uses an experimental React feature.**
 * @param clientCaller Caller function with typesafe input data for the Server Action.
 * @param initialOptData Initial optimistic data.
 * @param cb Optional callbacks executed when the action succeeds or fails.
 *
 * {@link https://github.com/TheEdoRan/next-safe-action/tree/main/packages/next-safe-action#optimistic-update--experimental See an example}
 */
export const useOptimisticAction = <const IV extends z.ZodTypeAny, const Data>(
	clientCaller: ClientCaller<IV, Data>,
	initialOptData: Data,
	cb?: HookCallbacks<IV, Data>
) => {
	const [response, setResponse] = useState<HookResponse<IV, Data>>({});
	const [input, setInput] = useState<z.input<IV>>();

	const [optState, syncState] = experimental_useOptimistic<
		Data & { __isExecuting__: boolean },
		Partial<Data>
	>({ ...initialOptData, ...response.data, __isExecuting__: false }, (state, newState) => ({
		...state,
		...newState,
		__isExecuting__: true,
	}));

	const executor = useRef(clientCaller);

	const { hasExecuted, hasSucceded, hasErrored } = getActionStatus<IV, Data>(response);

	const execute = useCallback(
		(input: z.input<IV>, newOptimisticData: Partial<Data>) => {
			syncState(newOptimisticData);
			setInput(input);

			return executor
				.current(input)
				.then((response) => setResponse(response))
				.catch((e) => {
					// NOTE: this doesn't work at the moment.
					if (isNextRedirectError(e) || isNextNotFoundError(e)) {
						throw e;
					}

					setResponse({ fetchError: e });
				});
		},
		[syncState]
	);

	const reset = useCallback(() => {
		setResponse({});
	}, []);

	useActionCallbacks(response, input, hasSucceded, hasErrored, reset, cb);

	const { __isExecuting__, ...optimisticData } = optState;

	return {
		execute,
		isExecuting: __isExecuting__,
		response,
		optimisticData: optimisticData as Data, // removes omit of `__isExecuting__` from type
		reset,
		hasExecuted,
		hasSucceded,
		hasErrored,
	};
};

export type { HookCallbacks, HookResponse };
