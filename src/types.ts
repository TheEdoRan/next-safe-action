import type { z } from "zod";

// The type for client action, which is called by components.
// You pass the input data here, and it's all typesafe.
export type ClientAction<IV extends z.ZodTypeAny, AO> = (input: z.infer<IV>) => Promise<{
	data?: AO;
	serverError?: true;
	validationError?: Partial<Record<keyof z.infer<IV>, string[]>>;
}>;

// We need to overload the `safeAction` function, because some actions
// need authentication, and others don't, so you can pass the `withAuth: true` property
// in the `opts` arg, to get back both `parsedInput` and `authArgs` in the server
// action function definition.
// `authArgs` comes from the previously defined `getAuthUserId` function.
export type SafeActionOverload<AuthData extends object> = {
	<const IV extends z.ZodTypeAny, const AO>(
		opts: {
			input: IV;
			withAuth?: false;
		},
		actionDefinition: (parsedInput: z.infer<IV>, authArgs: undefined) => Promise<AO>
	): ClientAction<IV, AO>;

	<const IV extends z.ZodTypeAny, const AO>(
		opts: {
			input: IV;
			withAuth: true;
		},
		actionDefinition: (parsedInput: z.infer<IV>, authArgs: AuthData) => Promise<AO>
	): ClientAction<IV, AO>;
};
