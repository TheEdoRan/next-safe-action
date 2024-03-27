import type { Infer, Schema } from "@typeschema/main";

// Extends an object without printing "&".
type Extend<S> = S extends infer U ? { [K in keyof U]: U[K] } : never;

// Object with an optional list of validation errors.
export type ErrorList = { _errors?: string[] } & {};

// Creates nested schema validation errors type using recursion.
type SchemaErrors<S> = {
	[K in keyof S]?: S[K] extends object | null | undefined
		? Extend<ErrorList & SchemaErrors<S[K]>>
		: ErrorList;
} & {};

/**
 * Type of the returned object when input validation fails.
 */
export type ValidationErrors<S extends Schema> = Extend<ErrorList & SchemaErrors<Infer<S>>>;
