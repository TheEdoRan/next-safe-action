"use client";

import type { InferIn, Schema } from "@typeschema/main";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {} from "react/experimental";
import type {} from "zod";
import { getActionShorthandStatusObject, getActionStatus, useActionCallbacks } from "./hooks-utils";
import type { HookCallbacks, HookSafeStateActionFn } from "./hooks.types";
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
	CVE,
	CBAVE,
	Data,
>(
	safeActionFn: HookSafeStateActionFn<ServerError, S, BAS, CVE, CBAVE, Data>,
	utils?: {
		initResult?: Awaited<ReturnType<typeof safeActionFn>>;
		permalink?: string;
	} & HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data>
) => {
	const [result, dispatcher, isExecuting] = React.useActionState(
		safeActionFn,
		utils?.initResult ?? {},
		utils?.permalink
	);
	const [isIdle, setIsIdle] = React.useState(true);
	const [clientInput, setClientInput] = React.useState<S extends Schema ? InferIn<S> : void>();
	const status = getActionStatus<ServerError, S, BAS, CVE, CBAVE, Data>({
		isExecuting,
		result: result ?? {},
		isIdle,
	});

	const execute = React.useCallback(
		(input: S extends Schema ? InferIn<S> : void) => {
			dispatcher(input as S extends Schema ? InferIn<S> : undefined);

			ReactDOM.flushSync(() => {
				setIsIdle(false);
				setClientInput(input);
			});
		},
		[dispatcher]
	);

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
		input: clientInput,
		result,
		status,
		...getActionShorthandStatusObject(status),
	};
};
