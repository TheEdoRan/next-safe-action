import * as React from "react";
import {} from "react/experimental";
import type { HookActionStatus, HookCallbacks, HookShorthandStatus } from "./hooks.types";
import type { SafeActionResult } from "./index.types";
import { FrameworkErrorHandler } from "./next/errors";
import type { InferInputOrDefault, StandardSchemaV1 } from "./standard.types";

export const getActionStatus = <
	ServerError,
	S extends StandardSchemaV1 | undefined,
	const BAS extends readonly StandardSchemaV1[],
	CVE,
	CBAVE,
	Data,
>({
	isIdle,
	isExecuting,
	result,
}: {
	isIdle: boolean;
	isExecuting: boolean;
	result: SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>;
}): HookActionStatus => {
	if (isIdle) {
		return "idle";
	} else if (isExecuting) {
		return "executing";
	} else if (
		typeof result.validationErrors !== "undefined" ||
		typeof result.bindArgsValidationErrors !== "undefined" ||
		typeof result.serverError !== "undefined"
	) {
		return "hasErrored";
	} else {
		return "hasSucceeded";
	}
};

export const getActionShorthandStatusObject = ({
	status,
	isTransitioning,
}: {
	status: HookActionStatus;
	isTransitioning: boolean;
}): HookShorthandStatus => {
	return {
		isIdle: status === "idle",
		isExecuting: status === "executing",
		isTransitioning,
		isPending: status === "executing" || isTransitioning,
		hasSucceeded: status === "hasSucceeded",
		hasErrored: status === "hasErrored",
	};
};

export const useActionCallbacks = <
	ServerError,
	S extends StandardSchemaV1 | undefined,
	const BAS extends readonly StandardSchemaV1[],
	CVE,
	CBAVE,
	Data,
>({
	result,
	input,
	status,
	cb,
	navigationError,
}: {
	result: SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>;
	input: InferInputOrDefault<S, undefined>;
	status: HookActionStatus;
	cb?: HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data>;
	navigationError?: Error | null;
}) => {
	const onExecuteRef = React.useRef(cb?.onExecute);
	const onSuccessRef = React.useRef(cb?.onSuccess);
	const onErrorRef = React.useRef(cb?.onError);
	const onSettledRef = React.useRef(cb?.onSettled);
	const onNavigationRef = React.useRef(cb?.onNavigation);

	// Execute the callback when the action status changes.
	React.useEffect(() => {
		const onExecute = onExecuteRef.current;
		const onSuccess = onSuccessRef.current;
		const onError = onErrorRef.current;
		const onSettled = onSettledRef.current;
		const onNavigation = onNavigationRef.current;

		const executeCallbacks = async () => {
			if (status === "executing") {
				await Promise.resolve(onExecute?.({ input }));
			} else if (navigationError) {
				await Promise.all([
					Promise.resolve(
						onNavigation?.({ input, navigationType: FrameworkErrorHandler.getNavigationType(navigationError) })
					),
					Promise.resolve(onSettled?.({ result, input })),
				]);

				throw navigationError;
			} else if (status === "hasSucceeded") {
				await Promise.all([
					Promise.resolve(onSuccess?.({ data: result?.data, input })),
					Promise.resolve(onSettled?.({ result, input })),
				]);
			} else if (status === "hasErrored") {
				await Promise.all([
					Promise.resolve(onError?.({ error: result, input })),
					Promise.resolve(onSettled?.({ result, input })),
				]);
			}
		};

		executeCallbacks().catch(console.error);
	}, [input, status, navigationError, result]);
};
