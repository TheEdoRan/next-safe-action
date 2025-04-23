import type { InferInputArray, InferInputOrDefault, StandardSchemaV1 } from "./standard-schema";
import type { MaybeArray, Prettify } from "./utils.types";

// Basic types and arrays.
type NotObject = number | string | boolean | bigint | symbol | null | undefined | any[];

// Object with an optional list of validation errors.
type VEList<K = undefined> = K extends any[] ? MaybeArray<{ _errors?: string[] }> : { _errors?: string[] };

// Creates nested schema validation errors type using recursion.
type SchemaErrors<S> = {
	[K in keyof S]?: S[K] extends NotObject ? Prettify<VEList<S[K]>> : Prettify<VEList> & SchemaErrors<S[K]>;
} & {};

export type IssueWithUnionErrors = StandardSchemaV1.Issue & {
	unionErrors?: { issues: StandardSchemaV1.Issue[] }[];
};

/**
 * Type of the returned object when validation fails.
 */
export type ValidationErrors<S extends StandardSchemaV1 | undefined> = S extends StandardSchemaV1
	? StandardSchemaV1.InferOutput<S> extends NotObject
		? Prettify<VEList>
		: Prettify<VEList> & SchemaErrors<StandardSchemaV1.InferOutput<S>>
	: undefined;

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
 * Type of the function used to format validation errors.
 */
export type HandleValidationErrorsShapeFn<
	S extends StandardSchemaV1 | undefined,
	BAS extends readonly StandardSchemaV1[],
	MD,
	Ctx extends object,
	CVE,
> = (
	validationErrors: ValidationErrors<S>,
	utils: {
		clientInput: InferInputOrDefault<S, undefined>;
		bindArgsClientInputs: InferInputArray<BAS>;
		metadata: MD;
		ctx: Prettify<Ctx>;
	}
) => Promise<CVE>;
