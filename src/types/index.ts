import type { z } from "zod";
import type { Merge } from "./merge";

// Remove undefined keys from object.
type NoUndefinedKeys<T> = T extends undefined
	? undefined
	: { [K in keyof T as T[K] extends undefined ? never : K]: T[K] };

// What a mutation definition function must return.
export type MutationOutput<SuccessData extends object, FailData extends object> =
	| {
			type: "success";
			data: SuccessData;
	  }
	| { type: "fail"; data: FailData };

// The type for client mutation, which is called by components.
// You pass the input data here, and it's all typesafe.
export type ClientMutation<IV extends z.ZodTypeAny, MO extends MutationOutput<{}, {}>> = (
	input: z.infer<IV>
) => Promise<{
	success?: Merge<NoUndefinedKeys<Extract<MO, { type: "success" }>["data"]>>;
	fail?: Merge<NoUndefinedKeys<Extract<MO, { type: "fail" }>["data"]>>;
	serverError?: true;
	validationError?: Partial<Record<keyof z.infer<IV>, string[]>>;
}>;

// We need to overload the `safeMutation` function, because some mutations
// need authentication, and others don't, so you can pass the `withAuth: true` property
// in the `opts` arg, to get back both `parsedInput` and `authArgs` in the server
// mutation function definition.
// `authArgs` comes from the previously defined `getAuthUserId` function.
export type SafeMutationOverload<AuthData extends object> = {
	<const IV extends z.ZodTypeAny, const MO extends MutationOutput<{}, {}>>(
		opts: {
			input: IV;
			withAuth?: false;
		},
		mutationDefinitionFunc: (parsedInput: z.infer<IV>, authArgs: undefined) => Promise<MO>
	): ClientMutation<IV, MO>;

	<const IV extends z.ZodTypeAny, const MO extends MutationOutput<{}, {}>>(
		opts: {
			input: IV;
			withAuth: true;
		},
		mutationDefinitionFunc: (parsedInput: z.infer<IV>, authArgs: AuthData) => Promise<MO>
	): ClientMutation<IV, MO>;
};
