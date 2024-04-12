import type { InferIn, Schema } from "@typeschema/main";
import type { SafeActionResult } from "./index.types";
import type { MaybePromise } from "./utils";

/**
 * Type of `result` object returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookResult<
	ServerError,
	S extends Schema,
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
	S extends Schema,
	BAS extends readonly Schema[],
	FVE,
	FBAVE,
	Data,
> = {
	onExecute?: (args: { input: InferIn<S> }) => MaybePromise<void>;
	onSuccess?: (args: { data: Data; input: InferIn<S>; reset: () => void }) => MaybePromise<void>;
	onError?: (args: {
		error: Omit<HookResult<ServerError, S, BAS, FVE, FBAVE, Data>, "data">;
		input: InferIn<S>;
		reset: () => void;
	}) => MaybePromise<void>;
	onSettled?: (args: {
		result: HookResult<ServerError, S, BAS, FVE, FBAVE, Data>;
		input: InferIn<S>;
		reset: () => void;
	}) => MaybePromise<void>;
};

/**
 * Type of the safe action function passed to hooks. Same as `SafeActionFn` except it accepts
 * just a single input, without bind arguments.
 */
export type HookSafeActionFn<
	ServerError,
	S extends Schema,
	BAS extends readonly Schema[],
	FVE,
	FBAVE,
	Data,
> = (clientInput: InferIn<S>) => Promise<SafeActionResult<ServerError, S, BAS, FVE, FBAVE, Data>>;

/**
 * Type of the action status returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookActionStatus = "idle" | "executing" | "hasSucceeded" | "hasErrored";
