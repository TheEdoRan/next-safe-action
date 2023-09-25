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
export type ServerCode<Schema extends z.ZodTypeAny, Data, Context extends object> = (
	parsedInput: z.input<Schema>,
	ctx: Context
) => Promise<Data>;

// HOOKS

/**
 * Type of `response` object returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookResponse<Schema extends z.ZodTypeAny, Data> = Awaited<
	ReturnType<SafeAction<Schema, Data>>
> & {
	fetchError?: unknown;
};

/**
 * Type of hooks callbacks (`onSuccess` and `onError`).
 * These are executed when the action succeeds or fails.
 */
export type HookCallbacks<Schema extends z.ZodTypeAny, Data> = {
	onSuccess?: (
		data: NonNullable<Pick<HookResponse<Schema, Data>, "data">["data"]>,
		input: z.input<Schema>,
		reset: () => void
	) => void;
	onError?: (
		error: Omit<HookResponse<Schema, Data>, "data">,
		input: z.input<Schema>,
		reset: () => void
	) => void;
};

/**
 * Type of the action status returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookActionStatus = "idle" | "executing" | "hasSucceded" | "hasErrored";
