import type { Infer, InferIn, Schema } from "@typeschema/main";

export const DEFAULT_SERVER_ERROR_MESSAGE = "Something went wrong while executing the operation.";

export const isError = (error: unknown): error is Error => error instanceof Error;

// UTIL TYPES

// Takes an object type and makes it more readable.
export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

// Returns type or promise of type.
export type MaybePromise<T> = Promise<T> | T;

// Infers output schema type in array of schemas.
export type InferArray<BAS extends readonly Schema[]> = {
	[K in keyof BAS]: Infer<BAS[K]>;
};

// Infers input schema type in array of schemas.
export type InferInArray<BAS extends readonly Schema[]> = {
	[K in keyof BAS]: InferIn<BAS[K]>;
};

// Validate with Zod.
export async function zodValidate<S extends Schema>(s: S, data: unknown) {
	const result = await s.safeParseAsync(data);

	if (result.success) {
		return {
			success: true,
			data: result.data as Infer<S>,
		} as const;
	}

	return {
		success: false,
		issues: result.error.issues.map(({ message, path }) => ({ message, path })),
	} as const;
}
