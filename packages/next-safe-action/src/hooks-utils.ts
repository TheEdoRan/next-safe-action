import * as React from "react";
import {} from "react/experimental";
import type { HookActionStatus, HookCallbacks, HookShorthandStatus } from "./hooks.types";
import type { SafeActionResult } from "./index.types";
import { FrameworkErrorHandler } from "./next/errors";
import type { InferInputOrDefault, StandardSchemaV1 } from "./standard-schema";

export const getActionStatus = <ServerError, S extends StandardSchemaV1 | undefined, CVE, Data>({
	isIdle,
	isExecuting,
	isTransitioning,
	result,
	hasNavigated,
	hasThrownError,
}: {
	isIdle: boolean;
	isExecuting: boolean;
	isTransitioning: boolean;
	hasNavigated: boolean;
	hasThrownError: boolean;
	result: SafeActionResult<ServerError, S, CVE, Data>;
}): HookActionStatus => {
	if (isIdle) {
		return "idle";
	} else if (isExecuting) {
		return "executing";
	} else if (isTransitioning) {
		return "transitioning";
	} else if (
		hasThrownError ||
		typeof result.validationErrors !== "undefined" ||
		typeof result.serverError !== "undefined"
	) {
		return "hasErrored";
	} else if (hasNavigated) {
		return "hasNavigated";
	} else {
		return "hasSucceeded";
	}
};

export const getActionShorthandStatusObject = (status: HookActionStatus): HookShorthandStatus => {
	return {
		isIdle: status === "idle",
		isExecuting: status === "executing",
		isTransitioning: status === "transitioning",
		isPending: status === "executing" || status === "transitioning",
		hasSucceeded: status === "hasSucceeded",
		hasErrored: status === "hasErrored",
		hasNavigated: status === "hasNavigated",
	};
};

export const useActionCallbacks = <ServerError, S extends StandardSchemaV1 | undefined, CVE, Data>({
	result,
	input,
	status,
	cb,
	navigationError,
	thrownError,
}: {
	result: SafeActionResult<ServerError, S, CVE, Data>;
	input: InferInputOrDefault<S, undefined>;
	status: HookActionStatus;
	cb?: HookCallbacks<ServerError, S, CVE, Data>;
	navigationError: Error | null;
	thrownError: Error | null;
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
			switch (status) {
				case "executing":
					await Promise.resolve(onExecute?.({ input })).then(() => {});
					break;
				case "transitioning":
					break;
				case "hasSucceeded":
					if (navigationError || thrownError) {
						break;
					}

					await Promise.all([
						Promise.resolve(onSuccess?.({ data: result.data!, input })),
						Promise.resolve(onSettled?.({ result, input })),
					]);
					break;
				case "hasErrored":
					await Promise.all([
						Promise.resolve(onError?.({ error: { ...result, ...(thrownError ? { thrownError } : {}) }, input })),
						Promise.resolve(onSettled?.({ result, input })),
					]);
					break;
			}

			// Navigation flow.
			// If the user redirected to a different page, the `hasNavigated` status never gets set.
			// In all the other cases, the `hasNavigated` status is set.
			if (!navigationError) return;
			const navigationKind = FrameworkErrorHandler.getNavigationKind(navigationError);

			if (navigationKind === "redirect" || status === "hasNavigated") {
				const navigationKind = FrameworkErrorHandler.getNavigationKind(navigationError);
				await Promise.all([
					Promise.resolve(
						onNavigation?.({
							input,
							navigationKind,
						})
					),
					Promise.resolve(onSettled?.({ result, input, navigationKind })),
				]);
			}

			throw navigationError;
		};

		executeCallbacks().catch(console.error);
	}, [input, status, result, navigationError, thrownError]);
};
