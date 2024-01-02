import type { Infer, InferIn, Schema } from "@decs/typeschema";
import type { MaybePromise } from "./utils";

// CLIENT

/**
 * Type of the function called from Client Components with typesafe input data.
 */
export type SafeAction<S extends Schema, Data> = (input: InferIn<S>) => Promise<{
	data?: Data;
	serverError?: string;
	validationErrors?: Partial<Record<keyof Infer<S> | "_root", string[]>>;
}>;

/**
 * Type of the function that executes server code when defining a new safe action.
 */
export type ServerCodeFn<S extends Schema, Data, Context> = (
	parsedInput: Infer<S>,
	ctx: Context
) => Promise<Data>;

// HOOKS

/**
 * Type of `result` object returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookResult<S extends Schema, Data> = Awaited<ReturnType<SafeAction<S, Data>>> & {
	fetchError?: string;
};

/**
 * Type of hooks callbacks. These are executed when action is in a specific state.
 */
export type HookCallbacks<S extends Schema, Data> = {
	onExecute?: (input: InferIn<S>) => MaybePromise<void>;
	onSuccess?: (data: Data, input: InferIn<S>, reset: () => void) => MaybePromise<void>;
	onError?: (
		error: Omit<HookResult<S, Data>, "data">,
		input: InferIn<S>,
		reset: () => void
	) => MaybePromise<void>;
	onSettled?: (
		result: HookResult<S, Data>,
		input: InferIn<S>,
		reset: () => void
	) => MaybePromise<void>;
};

/**
 * Type of the action status returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookActionStatus = "idle" | "executing" | "hasSucceeded" | "hasErrored";
