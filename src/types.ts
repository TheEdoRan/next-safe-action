import type { z } from "zod";

// The type for client action, which is called by components.
// You pass the input data here, and it's all typesafe.
export type ClientAction<IV extends z.ZodTypeAny, AO> = (input: z.input<IV>) => Promise<{
	data?: AO;
	serverError?: true;
	validationError?: Partial<Record<keyof z.input<IV>, string[]>>;
}>;

// We need to overload the `safeAction` function, because some actions
// need authentication, and others don't, so you can pass the `withAuth: true` property
// in the `opts` arg, to get back both `parsedInput` and `authArgs` in the server
// action function definition.
// `authArgs` comes from the previously defined `getAuthData` function.
export type SafeActionOverload<AuthData extends object> = {
	<const IV extends z.ZodTypeAny, const AO>(
		opts: {
			input: IV;
			withAuth?: false;
		},
		actionDefinition: (parsedInput: z.input<IV>, authArgs: undefined) => Promise<AO>
	): ClientAction<IV, AO>;

	<const IV extends z.ZodTypeAny, const AO>(
		opts: {
			input: IV;
			withAuth: true;
		},
		actionDefinition: (parsedInput: z.input<IV>, authArgs: AuthData) => Promise<AO>
	): ClientAction<IV, AO>;
};

// This is the hook response type.
export type HookRes<IV extends z.ZodTypeAny, AO> = Awaited<ReturnType<ClientAction<IV, AO>>> & {
	fetchError?: unknown;
};

// Hook callbacks are executed when a hook succeeds or fails.
export type HookCallbacks<IV extends z.ZodTypeAny, AO> = {
	onSuccess?: (data: NonNullable<Pick<HookRes<IV, AO>, "data">["data"]>, reset: () => void) => void;
	onError?: (error: Omit<HookRes<IV, AO>, "data">, reset: () => void) => void;
};
