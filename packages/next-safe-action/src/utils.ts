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

// Merges an object without printing "&".
export type PrettyMerge<S> = S extends infer U ? { [K in keyof U]: U[K] } : never;

// Infers output schema type in array of schemas.
export type InferArray<BAS extends readonly Schema[]> = {
	[K in keyof BAS]: Infer<BAS[K]>;
};

// Infers input schema type in array of schemas.
export type InferInArray<BAS extends readonly Schema[]> = {
	[K in keyof BAS]: InferIn<BAS[K]>;
};
