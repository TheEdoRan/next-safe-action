import * as React from "react";
import {} from "react/experimental";
import type { HookActionStatus, HookBaseUtils, HookCallbacks, HookShorthandStatus } from "./hooks.types";
import type { SafeActionResult } from "./index.types";
import { InferInputOrDefault, StandardSchemaV1 } from "./standard.types";

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

export const useExecuteOnMount = <S extends StandardSchemaV1 | undefined>(
	args: HookBaseUtils<S> & {
		executeFn: (input: InferInputOrDefault<S, void>) => void;
	}
) => {
	const mounted = React.useRef(false);

	React.useEffect(() => {
		const t = setTimeout(() => {
			if (args.executeOnMount && !mounted.current) {
				args.executeFn(args.executeOnMount.input as InferInputOrDefault<S, void>);
				mounted.current = true;
			}
		}, args.executeOnMount?.delayMs ?? 0);

		return () => {
			clearTimeout(t);
		};
	}, [args]);
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
}: {
	result: SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>;
	input: InferInputOrDefault<S, undefined>;
	status: HookActionStatus;
	cb?: HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data>;
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
					await Promise.all([
						Promise.resolve(onSuccess?.({ data: result?.data, input })),
						Promise.resolve(onSettled?.({ result, input })),
					]);
					break;
				case "hasErrored":
					await Promise.all([
						Promise.resolve(onError?.({ error: result, input })),
						Promise.resolve(onSettled?.({ result, input })),
					]);
					break;
			}
		};

		executeCallbacks().catch(console.error);
	}, [status, result, input]);
};
