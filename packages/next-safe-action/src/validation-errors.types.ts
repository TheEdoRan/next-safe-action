import type { Infer, Schema } from "@typeschema/main";

// Merges an object without printing "&".
type PrettyMerge<S> = S extends infer U ? { [K in keyof U]: U[K] } : never;

// Object with an optional list of validation errors.
export type ErrorList<BindArg = false> = (BindArg extends true
	? { _errors: string[] }
	: { _errors?: string[] }) & {};

// Creates nested schema validation errors type using recursion.
type SchemaErrors<S> = {
	[K in keyof S]?: S[K] extends object | null | undefined
		? PrettyMerge<ErrorList & SchemaErrors<S[K]>>
		: ErrorList;
} & {};

/**
 * Type of the returned object when input validation fails.
 */
export type ValidationErrors<S extends Schema, BindArg = false> =
	Infer<S> extends object ? PrettyMerge<ErrorList & SchemaErrors<Infer<S>>> : ErrorList<BindArg>;

/**
 * Type of the array of validation errors of bind arguments.
 */
export type BindArgsValidationErrors<BAS extends readonly Schema[]> = {
	[K in keyof BAS]: ValidationErrors<BAS[K], true> | null;
};

/**
 * Type of flattened validation errors. `formErrors` contains global errors, and `fieldErrors`
 * contains errors for each field, one level deep.
 */
export type FlattenedValidationErrors<S extends Schema, VE extends ValidationErrors<S>> = {
	formErrors: string[];
	fieldErrors: {
		[K in keyof Omit<VE, "_errors">]?: string[];
	};
};

export type FormatValidationErrorsFn<S extends Schema, FVE> = (
	validationErrors: ValidationErrors<S>
) => FVE;

export type FormatBindArgsValidationErrorsFn<BAS extends readonly Schema[], FBAVE> = (
	bindArgsValidationErrors: BindArgsValidationErrors<BAS>
) => FBAVE;
