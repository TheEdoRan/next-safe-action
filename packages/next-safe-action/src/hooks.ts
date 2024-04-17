"use client";

import type { InferIn, Schema } from "@typeschema/main";
import { isNotFoundError } from "next/dist/client/components/not-found.js";
import { isRedirectError } from "next/dist/client/components/redirect.js";
import * as React from "react";
import {} from "react/experimental";
import type { HookActionStatus, HookCallbacks, HookResult, HookSafeActionFn } from "./hooks.types";
import { isError } from "./utils";

// UTILS

const DEFAULT_RESULT = {
	data: undefined,
	fetchError: undefined,
	serverError: undefined,
	validationErrors: undefined,
} satisfies HookResult<any, any, any, any, any, any>;

const getActionStatus = <
	const ServerError,
	const S extends Schema | undefined,
	const BAS extends readonly Schema[],
	const FVE,
	const FBAVE,
	const Data,
>({
	isExecuting,
	result,
}: {
	isExecuting: boolean;
	result: HookResult<ServerError, S, BAS, FVE, FBAVE, Data>;
}): HookActionStatus => {
	if (isExecuting) {
		return "executing";
	} else if (typeof result.data !== "undefined") {
		return "hasSucceeded";
	} else if (
		typeof result.validationErrors !== "undefined" ||
		typeof result.bindArgsValidationErrors !== "undefined" ||
		typeof result.serverError !== "undefined" ||
		typeof result.fetchError !== "undefined"
	) {
		return "hasErrored";
	}

	return "idle";
};

const useActionCallbacks = <
	const ServerError,
	const S extends Schema | undefined,
	const BAS extends readonly Schema[],
	const FVE,
	const FBAVE,
	const Data,
>({
	result,
	input,
	status,
	reset,
	cb,
}: {
	result: HookResult<ServerError, S, BAS, FVE, FBAVE, Data>;
	input: S extends Schema ? InferIn<S> : undefined;
	status: HookActionStatus;
	reset: () => void;
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
					await Promise.resolve(onSuccess?.({ data: result.data!, input, reset }));
					await Promise.resolve(onSettled?.({ result, input, reset }));
					break;
				case "hasErrored":
					await Promise.resolve(onError?.({ error: result, input, reset }));
					await Promise.resolve(onSettled?.({ result, input, reset }));
					break;
			}
		};

		executeCallbacks().catch(console.error);
	}, [status, result, reset, input]);
};

// HOOKS

/**
 * Use the action from a Client Component via hook.
 * @param safeActionFn The typesafe action.
 * @param callbacks Optional callbacks executed based on the action status.
 *
 * {@link https://next-safe-action.dev/docs/usage/client-components/hooks/useaction See an example}
 */
export const useAction = <
	const ServerError,
	const S extends Schema | undefined,
	const BAS extends readonly Schema[],
	const FVE,
	const FBAVE,
	const Data,
>(
	safeActionFn: HookSafeActionFn<ServerError, S, BAS, FVE, FBAVE, Data>,
	callbacks?: HookCallbacks<ServerError, S, BAS, FVE, FBAVE, Data>
) => {
	const [, startTransition] = React.useTransition();
	const [result, setResult] =
		React.useState<HookResult<ServerError, S, BAS, FVE, FBAVE, Data>>(DEFAULT_RESULT);
	const [input, setInput] = React.useState<S extends Schema ? InferIn<S> : undefined>();
	const [isExecuting, setIsExecuting] = React.useState(false);

	const status = getActionStatus<ServerError, S, BAS, FVE, FBAVE, Data>({ isExecuting, result });

	const execute = React.useCallback(
		(input: S extends Schema ? InferIn<S> : undefined) => {
			setInput(input);
			setIsExecuting(true);

			return startTransition(() => {
				return safeActionFn(input)
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
		[safeActionFn]
	);

	const reset = React.useCallback(() => {
		setResult(DEFAULT_RESULT);
	}, []);

	useActionCallbacks({
		result,
		input: input as S extends Schema ? InferIn<S> : undefined,
		status,
		reset,
		cb: callbacks,
	});

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
 * @param safeActionFn The typesafe action.
 * @param initialOptimisticData Initial optimistic data.
 * @param reducer Optimistic state reducer.
 * @param callbacks Optional callbacks executed based on the action status.
 *
 * {@link https://next-safe-action.dev/docs/usage/client-components/hooks/useoptimisticaction See an example}
 */
export const useOptimisticAction = <
	const ServerError,
	const S extends Schema | undefined,
	const BAS extends readonly Schema[],
	const FVE,
	const FBAVE,
	const Data,
>(
	safeActionFn: HookSafeActionFn<ServerError, S, BAS, FVE, FBAVE, Data>,
	initialOptimisticData: Data,
	reducer: (state: Data, input: S extends Schema ? InferIn<S> : undefined) => Data,
	callbacks?: HookCallbacks<ServerError, S, BAS, FVE, FBAVE, Data>
) => {
	const [, startTransition] = React.useTransition();
	const [result, setResult] =
		React.useState<HookResult<ServerError, S, BAS, FVE, FBAVE, Data>>(DEFAULT_RESULT);
	const [input, setInput] = React.useState<S extends Schema ? InferIn<S> : undefined>();
	const [isExecuting, setIsExecuting] = React.useState(false);

	const [optimisticData, setOptimisticState] = React.useOptimistic<
		Data,
		S extends Schema ? InferIn<S> : undefined
	>(initialOptimisticData, reducer);

	const status = getActionStatus<ServerError, S, BAS, FVE, FBAVE, Data>({ isExecuting, result });

	const execute = React.useCallback(
		(input: S extends Schema ? InferIn<S> : undefined) => {
			setInput(input);
			setIsExecuting(true);

			return startTransition(() => {
				setOptimisticState(input);
				return safeActionFn(input)
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
		[setOptimisticState, safeActionFn]
	);

	const reset = React.useCallback(() => {
		setResult(DEFAULT_RESULT);
	}, []);

	useActionCallbacks({
		result,
		input: input as S extends Schema ? InferIn<S> : undefined,
		status,
		reset,
		cb: callbacks,
	});

	return {
		execute,
		result,
		optimisticData,
		reset,
		status,
	};
};

export type { HookActionStatus, HookCallbacks, HookResult, HookSafeActionFn };
