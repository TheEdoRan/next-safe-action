import type { Infer, Schema } from "@typeschema/main";
import type { Prettify } from "./utils";

// Object with an optional list of validation errors.
type VEList = Prettify<{ _errors?: string[] }>;

// Creates nested schema validation errors type using recursion.
type SchemaErrors<S> = {
	[K in keyof S]?: S[K] extends object | null | undefined ? Prettify<VEList & SchemaErrors<S[K]>> : VEList;
} & {};

/**
 * Type of the returned object when input validation fails.
 */
export type ValidationErrors<S extends Schema | undefined> = S extends Schema
	? Infer<S> extends object
		? Prettify<VEList & SchemaErrors<Infer<S>>>
		: VEList
	: undefined;

/**
 * Type of the array of validation errors of bind arguments.
 */
export type BindArgsValidationErrors<BAS extends readonly Schema[]> = {
	[K in keyof BAS]: ValidationErrors<BAS[K]>;
};

/**
 * Type of flattened validation errors. `formErrors` contains global errors, and `fieldErrors`
 * contains errors for each field, one level deep.
 */
export type FlattenedValidationErrors<VE extends ValidationErrors<any>> = Prettify<{
	formErrors: string[];
	fieldErrors: {
		[K in keyof Omit<VE, "_errors">]?: string[];
	};
}>;

/**
 * Type of flattened bind arguments validation errors.
 */
export type FlattenedBindArgsValidationErrors<BAVE extends readonly ValidationErrors<any>[]> = {
	[K in keyof BAVE]: FlattenedValidationErrors<BAVE[K]>;
};

/**
 * Type of the function used to format validation errors.
 */
export type FormatValidationErrorsFn<S extends Schema | undefined, FVE> = (
	validationErrors: ValidationErrors<S>
) => FVE;

/**
 * Type of the function used to format bind arguments validation errors.
 */
export type FormatBindArgsValidationErrorsFn<BAS extends readonly Schema[], FBAVE> = (
	bindArgsValidationErrors: BindArgsValidationErrors<BAS>
) => FBAVE;
