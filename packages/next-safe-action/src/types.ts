import type { z } from "zod";

// CLIENT

/**
 * Type of the function called from Client Components with typesafe input data for the Server Action.
 */
export type ClientCaller<IV extends z.ZodTypeAny, Data> = (input: z.input<IV>) => Promise<{
	data?: Data;
	serverError?: true;
	validationError?: Partial<Record<keyof z.input<IV>, string[]>>;
}>;

/**
 * Type of action initializer. Some actions need authentication and others don't.
 * 1. If you don't need authentication, just pass `input` (Zod input validator) to `opts`.
 * You'll receive the parsed input as Server Action function definition parameter.
 * {@link https://github.com/TheEdoRan/next-safe-action/tree/main/packages/next-safe-action#1-the-direct-way See an example}.
 * 2. If you need authentication, you have to pass `withAuth: true`,
 * along with `input` (Zod input validator) when you're creating a new action.
 * In this case, you receive both the parsed input and auth data as
 * Server Action function definition parameters.
 * {@link https://github.com/TheEdoRan/next-safe-action/tree/main/packages/next-safe-action#authenticated-action See an example}.
 */
export type ActionOverload<AuthData extends object> = {
	<const IV extends z.ZodTypeAny, const Data>(
		opts: {
			input: IV;
			withAuth?: false;
		},
		actionDefinition: (parsedInput: z.input<IV>, authData: undefined) => Promise<Data>
	): ClientCaller<IV, Data>;

	<const IV extends z.ZodTypeAny, const Data>(
		opts: {
			input: IV;
			withAuth: true;
		},
		actionDefinition: (parsedInput: z.input<IV>, authData: AuthData) => Promise<Data>
	): ClientCaller<IV, Data>;
};

// HOOKS

/**
 * Type of `res` object returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookRes<IV extends z.ZodTypeAny, Data> = Awaited<ReturnType<ClientCaller<IV, Data>>> & {
	fetchError?: unknown;
};

/**
 * Type of hooks callbacks (`onSuccess` and `onError`).
 * These are executed when the action succeeds or fails.
 */
export type HookCallbacks<IV extends z.ZodTypeAny, Data> = {
	onSuccess?: (
		data: NonNullable<Pick<HookRes<IV, Data>, "data">["data"]>,
		reset: () => void
	) => void;
	onError?: (error: Omit<HookRes<IV, Data>, "data">, reset: () => void) => void;
};
