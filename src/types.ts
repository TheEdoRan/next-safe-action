import type { z } from "zod";

// The type for client mutation, which is called by components.
// You pass the input data here, and it's all typesafe.
export type ClientMutation<IV extends z.ZodTypeAny, MO> = (input: z.infer<IV>) => Promise<{
	data?: MO;
	serverError?: true;
	validationError?: Partial<Record<keyof z.infer<IV>, string[]>>;
}>;

// We need to overload the `safeMutation` function, because some mutations
// need authentication, and others don't, so you can pass the `withAuth: true` property
// in the `opts` arg, to get back both `parsedInput` and `authArgs` in the server
// mutation function definition.
// `authArgs` comes from the previously defined `getAuthUserId` function.
export type SafeMutationOverload<AuthData extends object> = {
	<const IV extends z.ZodTypeAny, const MO>(
		opts: {
			input: IV;
			withAuth?: false;
		},
		mutationDefinitionFunc: (parsedInput: z.infer<IV>, authArgs: undefined) => Promise<MO>
	): ClientMutation<IV, MO>;

	<const IV extends z.ZodTypeAny, const MO>(
		opts: {
			input: IV;
			withAuth: true;
		},
		mutationDefinitionFunc: (parsedInput: z.infer<IV>, authArgs: AuthData) => Promise<MO>
	): ClientMutation<IV, MO>;
};
