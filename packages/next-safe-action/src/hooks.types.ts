import type { InferIn, Schema } from "@typeschema/main";
import type { SafeActionResult } from "./index.types";
import type { MaybePromise } from "./utils";

/**
 * Type of `result` object returned by `useAction`, `useOptimisticAction` and `useStateAction` hooks.
 * If a server-client communication error occurs, `fetchError` will be set to the error message.
 */
export type HookResult<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	FVE,
	FBAVE,
	Data,
> = SafeActionResult<ServerError, S, BAS, FVE, FBAVE, Data> & {
	fetchError?: string;
};

/**
 * Type of hooks callbacks. These are executed when action is in a specific state.
 */
export type HookCallbacks<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	FVE,
	FBAVE,
	Data,
> = {
	onExecute?: (args: { input: S extends Schema ? InferIn<S> : undefined }) => MaybePromise<void>;
	onSuccess?: (args: { data: Data; input: S extends Schema ? InferIn<S> : undefined }) => MaybePromise<void>;
	onError?: (args: {
		error: Omit<HookResult<ServerError, S, BAS, FVE, FBAVE, Data>, "data">;
		input: S extends Schema ? InferIn<S> : undefined;
	}) => MaybePromise<void>;
	onSettled?: (args: {
		result: HookResult<ServerError, S, BAS, FVE, FBAVE, Data>;
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
	FVE,
	FBAVE,
	Data,
> = (
	input: S extends Schema ? InferIn<S> : undefined
) => Promise<SafeActionResult<ServerError, S, BAS, FVE, FBAVE, Data>>;

/**
 * Type of the stateful safe action function passed to hooks. Same as `SafeStateActionFn` except it accepts
 * just a single input, without bind arguments.
 */
export type HookStateSafeActionFn<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	FVE,
	FBAVE,
	Data,
> = (
	prevResult: SafeActionResult<ServerError, S, BAS, FVE, FBAVE, Data>,
	input: S extends Schema ? InferIn<S> : undefined
) => Promise<SafeActionResult<ServerError, S, BAS, FVE, FBAVE, Data>>;

/**
 * Type of the action status returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookActionStatus = "idle" | "executing" | "hasSucceeded" | "hasErrored";
