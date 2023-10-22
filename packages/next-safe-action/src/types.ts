import type { z } from "zod";

// CLIENT

/**
 * Type of the function called from Client Components with typesafe input data.
 */
export type SafeAction<Schema extends z.ZodTypeAny, Data> = (input: z.input<Schema>) => Promise<{
	data?: Data;
	serverError?: string;
	validationError?: Partial<Record<keyof z.input<Schema>, string[]>>;
}>;

/**
 * Type of the function that executes server code when defining a new safe action.
 */
export type ServerCode<Schema extends z.ZodTypeAny, Data, Context> = (
	parsedInput: z.input<Schema>,
	ctx: Context
) => Promise<Data>;

// HOOKS

/**
 * Type of `result` object returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookResult<Schema extends z.ZodTypeAny, Data> = Awaited<
	ReturnType<SafeAction<Schema, Data>>
> & {
	fetchError?: string;
};

/**
 * Type of hooks callbacks. These are executed when action is in a specific state.
 */
export type HookCallbacks<Schema extends z.ZodTypeAny, Data> = {
	onExecute?: (input: z.input<Schema>) => MaybePromise<void>;
	onSuccess?: (data: Data, input: z.input<Schema>, reset: () => void) => MaybePromise<void>;
	onError?: (
		error: Omit<HookResult<Schema, Data>, "data">,
		input: z.input<Schema>,
		reset: () => void
	) => MaybePromise<void>;
	onSettled?: (
		result: HookResult<Schema, Data>,
		input: z.input<Schema>,
		reset: () => void
	) => MaybePromise<void>;
};

/**
 * Type of the action status returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookActionStatus = "idle" | "executing" | "hasSucceeded" | "hasErrored";

export type MaybePromise<T> = Promise<T> | T;
