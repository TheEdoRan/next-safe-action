import type { z } from "zod";

// CLIENT

/**
 * Type of the function called from Client Components with typesafe input data for the Server Action.
 */
export type ClientCaller<IV extends z.ZodTypeAny, Data> = (input: z.input<IV>) => Promise<{
	data?: Data;
	serverError?: string;
	validationError?: Partial<Record<keyof z.input<IV>, string[]>>;
}>;

/**
 * Type of the function that executes server code when defining a new safe action.
 */
export type ServerCode<IV extends z.ZodTypeAny, Data, Context extends object> = (
	parsedInput: z.input<IV>,
	ctx: Context
) => Promise<Data>;

// HOOKS

/**
 * Type of `response` object returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookResponse<IV extends z.ZodTypeAny, Data> = Awaited<
	ReturnType<ClientCaller<IV, Data>>
> & {
	fetchError?: unknown;
};

/**
 * Type of hooks callbacks (`onSuccess` and `onError`).
 * These are executed when the action succeeds or fails.
 */
export type HookCallbacks<IV extends z.ZodTypeAny, Data> = {
	onSuccess?: (
		data: NonNullable<Pick<HookResponse<IV, Data>, "data">["data"]>,
		input: z.input<IV>,
		reset: () => void
	) => void;
	onError?: (
		error: Omit<HookResponse<IV, Data>, "data">,
		input: z.input<IV>,
		reset: () => void
	) => void;
};

/**
 * Type of the action status returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookActionStatus = "idle" | "executing" | "hasSucceded" | "hasErrored";

export type MaybePromise<T> = T | Promise<T>;
