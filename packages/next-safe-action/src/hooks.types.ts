import type { InferIn, Schema } from "@typeschema/main";
import type { SafeActionResult } from "./index.types";
import type { MaybePromise } from "./utils";

/**
 * Type of `result` object returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookResult<ServerError, S extends Schema, Data> = SafeActionResult<
	ServerError,
	S,
	Data
> & {
	fetchError?: string;
};

/**
 * Type of hooks callbacks. These are executed when action is in a specific state.
 */
export type HookCallbacks<ServerError, S extends Schema, Data> = {
	onExecute?: (input: InferIn<S>) => MaybePromise<void>;
	onSuccess?: (data: Data, input: InferIn<S>, reset: () => void) => MaybePromise<void>;
	onError?: (
		error: Omit<HookResult<ServerError, S, Data>, "data">,
		input: InferIn<S>,
		reset: () => void
	) => MaybePromise<void>;
	onSettled?: (
		result: HookResult<ServerError, S, Data>,
		input: InferIn<S>,
		reset: () => void
	) => MaybePromise<void>;
};

/**
 * Type of the action status returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookActionStatus = "idle" | "executing" | "hasSucceeded" | "hasErrored";
