import type { Infer, InferIn, Schema } from "@typeschema/main";

export const DEFAULT_SERVER_ERROR_MESSAGE = "Something went wrong while executing the operation.";

export const isError = (error: unknown): error is Error => error instanceof Error;

// UTIL TYPES

// Returns type or promise of type.
export type MaybePromise<T> = Promise<T> | T;

// Infer input schema type in array of schemas.
export type InferInArray<S extends Schema[]> = {
	[K in keyof S]: InferIn<S[K]>;
};

// Infer output schema type in array of schemas.
export type InferArray<S extends Schema[]> = {
	[K in keyof S]: Infer<S[K]>;
};
