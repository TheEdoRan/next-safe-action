import type { Infer, InferIn, Schema } from "@typeschema/main";

export const DEFAULT_SERVER_ERROR_MESSAGE = "Something went wrong while executing the operation.";

export const isError = (error: unknown): error is Error => error instanceof Error;

// UTIL TYPES

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
