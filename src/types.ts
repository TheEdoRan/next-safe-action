import type { z } from "zod";

// The type for client mutation, which is called by components.
// You pass the input data here, and it's all typesafe.
export type ClientMutation<IV extends z.ZodTypeAny, OV extends z.ZodTypeAny> = (
	input: z.infer<IV>
) => Promise<{
	success?: Extract<z.infer<OV>, { type: "success" }>["data"];
	error?: Extract<z.infer<OV>, { type: "error" }>["data"];
	serverError?: true;
	inputValidationError?: Partial<Record<keyof z.infer<IV>, string[]>>;
}>;

// We need to overload the `safeMutation` function, because some mutations
// need authentication, and others don't, so you can pass the `withAuth: true` property
// in the `opts` arg, to get back both `parsedInput` and `authArgs` in the server
// mutation function definition.
// `authArgs` comes from the previously defined `getAuthUserId` function.
export type SafeMutationOverload<AuthData extends object> = {
	<const IV extends z.ZodTypeAny, const OV extends z.ZodTypeAny>(
		opts: {
			inputValidator: IV;
			outputValidator: OV;
			withAuth?: false;
		},
		mutationDefinitionFunc: (parsedInput: z.infer<IV>, authArgs: undefined) => Promise<z.infer<OV>>
	): ClientMutation<IV, OV>;

	<const IV extends z.ZodTypeAny, const OV extends z.ZodTypeAny>(
		opts: {
			inputValidator: IV;
			outputValidator: OV;
			withAuth: true;
		},
		mutationDefinitionFunc: (parsedInput: z.infer<IV>, authArgs: AuthData) => Promise<z.infer<OV>>
	): ClientMutation<IV, OV>;
};
