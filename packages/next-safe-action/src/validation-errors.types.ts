import type { Infer, InferIn, Schema } from "./adapters/types";
import type { Prettify } from "./utils.types";

// Basic types and arrays.
type NotObject = number | string | boolean | bigint | symbol | null | undefined | any[];

// Object with an optional list of validation errors.
type VEList = Prettify<{ _errors?: string[] }>;

// Creates nested schema validation errors type using recursion.
type SchemaErrors<S> = {
	[K in keyof S]?: S[K] extends NotObject ? VEList : Prettify<VEList & SchemaErrors<S[K]>>;
} & {};

/**
 * Type of the returned object when validation fails.
 */
export type ValidationErrors<S extends Schema | undefined> = S extends Schema
	? Infer<S> extends NotObject
		? VEList
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
) => CVE | Promise<CVE>;

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
) => CBAVE | Promise<CBAVE>;
