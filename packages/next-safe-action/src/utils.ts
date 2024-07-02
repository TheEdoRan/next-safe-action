import type { z } from "zod";

export const DEFAULT_SERVER_ERROR_MESSAGE = "Something went wrong while executing the operation.";

export const isError = (error: unknown): error is Error => error instanceof Error;

// UTIL TYPES

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

/**
 * This error is thrown when an action's metadata input is invalid, i.e. when there's a mismatch between the
 * type of the metadata schema returned from `defineMetadataSchema` and the actual input.
 */
export class ActionMetadataError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ActionMetadataError";
	}
}
