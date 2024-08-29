"use client";

import * as React from "react";
import {} from "react/experimental";
import type {} from "zod";
import type { InferIn, Schema } from "./adapters/types";
import { getActionShorthandStatusObject, getActionStatus, useActionCallbacks, useExecuteOnMount } from "./hooks-utils";
import type { HookBaseUtils, HookCallbacks, HookSafeStateActionFn, UseStateActionHookReturn } from "./hooks.types";
/**
 * Use the stateful action from a Client Component via hook. Used for actions defined with [`stateAction`](https://next-safe-action.dev/docs/define-actions/instance-methods#action--stateaction).
 * @param safeActionFn The action function
 * @param utils Optional `initResult`, `permalink`, base utils and callbacks
 *
 * {@link https://next-safe-action.dev/docs/execute-actions/hooks/usestateaction See docs for more information}
 */
export const useStateAction = <
	ServerError,
	S extends Schema | undefined,
	const BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
>(
	safeActionFn: HookSafeStateActionFn<ServerError, S, BAS, CVE, CBAVE, Data>,
	utils?: {
		initResult?: Awaited<ReturnType<typeof safeActionFn>>;
		permalink?: string;
	} & HookBaseUtils<S> &
		HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data>
): UseStateActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data> => {
	const [result, dispatcher, isExecuting] = React.useActionState(
		safeActionFn,
		utils?.initResult ?? {},
		utils?.permalink
	);
	const [isIdle, setIsIdle] = React.useState(true);
	const [isTransitioning, startTransition] = React.useTransition();
	const [clientInput, setClientInput] = React.useState<S extends Schema ? InferIn<S> : void>();
	const status = getActionStatus<ServerError, S, BAS, CVE, CBAVE, Data>({
		isExecuting,
		result: result ?? {},
		isIdle,
	});

	const execute = React.useCallback(
		(input: S extends Schema ? InferIn<S> : void) => {
			setTimeout(() => {
				setIsIdle(false);
				setClientInput(input);
			}, 0);

			startTransition(() => {
				dispatcher(input as S extends Schema ? InferIn<S> : undefined);
			});
		},
		[dispatcher]
	);

	useExecuteOnMount({
		executeOnMount: utils?.executeOnMount,
		executeFn: execute,
	});

	useActionCallbacks({
		result: result ?? {},
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
		input: clientInput as S extends Schema ? InferIn<S> : undefined,
		result,
		status,
		...getActionShorthandStatusObject({ status, isTransitioning }),
	};
};
