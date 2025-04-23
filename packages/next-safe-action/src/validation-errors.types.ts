import type { Infer, InferIn, Schema, ValidationIssue } from "./adapters/types";
import type { MaybeArray, Prettify } from "./utils.types";

// Basic types and arrays.
type NotObject = number | string | boolean | bigint | symbol | null | undefined | any[];

// Object with an optional list of validation errors.
type VEList<K = undefined> = K extends any[] ? MaybeArray<{ _errors?: string[] }> : { _errors?: string[] };

// Creates nested schema validation errors type using recursion.
type SchemaErrors<S> = {
	[K in keyof S]?: S[K] extends NotObject ? VEList<S[K]> : Prettify<VEList & SchemaErrors<S[K]>>;
} & {};

export type IssueWithUnionErrors = ValidationIssue & {
	unionErrors?: { issues: ValidationIssue[] }[];
};

/**
 * Type of the returned object when validation fails.
 */
export type ValidationErrors<S extends Schema | undefined> = S extends Schema
	? Infer<S> extends NotObject
		? Prettify<VEList>
		: Prettify<VEList & SchemaErrors<Infer<S>>>
	: undefined;

/**
 * Type of the array of bind arguments validation errors.
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
export type HandleValidationErrorsShapeFn<
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	MD,
	Ctx extends object,
	CVE,
> = (
	validationErrors: ValidationErrors<S>,
	utils: {
		clientInput: S extends Schema ? InferIn<S> : undefined;
		bindArgsClientInputs: BAS;
		metadata: MD;
		ctx: Prettify<Ctx>;
	}
) => Promise<CVE>;

/**
 * Type of the function used to format bind arguments validation errors.
 */
export type HandleBindArgsValidationErrorsShapeFn<
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	MD,
	Ctx extends object,
	CBAVE,
> = (
	bindArgsValidationErrors: BindArgsValidationErrors<BAS>,
	utils: {
		clientInput: S extends Schema ? InferIn<S> : undefined;
		bindArgsClientInputs: BAS;
		metadata: MD;
		ctx: Prettify<Ctx>;
	}
) => Promise<CBAVE>;
