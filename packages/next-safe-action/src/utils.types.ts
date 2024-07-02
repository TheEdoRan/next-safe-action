import type { z } from "zod";

// Takes an object type and makes it more readable.
export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

// Returns type or promise of type.
export type MaybePromise<T> = Promise<T> | T;

// Schema type.
export type Schema = z.ZodType;

// Infers output schema type.
export type Infer<S extends Schema> = z.infer<S>;

// Infers input schema type.
export type InferIn<S extends Schema> = z.input<S>;

// Infers output schema type in array of schemas.
export type InferArray<BAS extends readonly Schema[]> = {
	[K in keyof BAS]: Infer<BAS[K]>;
};

// Infers input schema type in array of schemas.
export type InferInArray<BAS extends readonly Schema[]> = {
	[K in keyof BAS]: InferIn<BAS[K]>;
};
