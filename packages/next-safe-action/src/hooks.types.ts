import type { SafeActionResult } from "./index.types";
import type { InferIn, MaybePromise, Prettify, Schema } from "./utils.types";

/**
 * Type of `result` object returned by `useAction`, `useOptimisticAction` and `useStateAction` hooks.
 * If a server-client communication error occurs, `fetchError` will be set to the error message.
 */
export type HookResult<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
> = SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data> & {
	fetchError?: string;
};

/**
 * Type of hooks callbacks. These are executed when action is in a specific state.
 */
export type HookCallbacks<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
> = {
	onExecute?: (args: { input: S extends Schema ? InferIn<S> : undefined }) => MaybePromise<void>;
	onSuccess?: (args: { data?: Data; input: S extends Schema ? InferIn<S> : undefined }) => MaybePromise<void>;
	onError?: (args: {
		error: Prettify<Omit<HookResult<ServerError, S, BAS, CVE, CBAVE, Data>, "data">>;
		input: S extends Schema ? InferIn<S> : undefined;
	}) => MaybePromise<void>;
	onSettled?: (args: {
		result: Prettify<HookResult<ServerError, S, BAS, CVE, CBAVE, Data>>;
		input: S extends Schema ? InferIn<S> : undefined;
	}) => MaybePromise<void>;
};

/**
 * Type of the safe action function passed to hooks. Same as `SafeActionFn` except it accepts
 * just a single input, without bind arguments.
 */
export type HookSafeActionFn<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
> = (
	input: S extends Schema ? InferIn<S> : undefined
) => Promise<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data> | undefined>;

/**
 * Type of the stateful safe action function passed to hooks. Same as `SafeStateActionFn` except it accepts
 * just a single input, without bind arguments.
 */
export type HookSafeStateActionFn<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
> = (
	prevResult: SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>,
	input: S extends Schema ? InferIn<S> : undefined
) => Promise<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>;

/**
 * Type of the action status returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookActionStatus = "idle" | "executing" | "hasSucceeded" | "hasErrored";
