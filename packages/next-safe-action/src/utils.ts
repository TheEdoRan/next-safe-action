import type { Infer, Schema, ValidationIssue } from "@decs/typeschema";

export const isError = (error: any): error is Error => error instanceof Error;

// UTIL TYPES

// Returns type or promise of type.
export type MaybePromise<T> = Promise<T> | T;

// Extends an object without printing "&".
type Extend<S> = S extends infer U ? { [K in keyof U]: U[K] } : never;

// VALIDATION ERRORS

type ErrorList = { _errors?: string[] } & {};

// Creates nested schema errors type using recursion.
type SchemaErrors<S> = {
	[K in keyof S]?: S[K] extends object ? Extend<ErrorList & SchemaErrors<S[K]>> : ErrorList;
} & {};

// Merges root errors with nested schema errors.
export type ValidationErrors<S extends Schema> = Extend<ErrorList & SchemaErrors<Infer<S>>>;

// This function is used to build the validation errors object from a list of validation issues.
export const buildValidationErrors = <const S extends Schema>(issues: ValidationIssue[]) => {
	const ve: any = {};

	for (const issue of issues) {
		const { path, message } = issue;

		// When path is undefined or empty, set root errors.
		if (!path || path.length === 0) {
			ve._errors = Array.isArray(ve._errors) ? [...ve._errors, message] : [message];
			continue;
		}

		// Reference to errors object.
		let ref = ve;

		// Set object for the path, if it doesn't exist.
		for (let i = 0; i < path.length - 1; i++) {
			const k = path[i]!;

			if (!(k in ref)) {
				ref[k] = {};
			}

			ref = ref[k];
		}

		// Key is always the last element of the path.
		const key = path[path.length - 1]!;

		// Set error for the current path. If `_errors` array exists, add the message to it.
		ref[key] = (
			Array.isArray(ref[key]?._errors)
				? { ...structuredClone(ref[key]), _errors: [...ref[key]!._errors!, message] }
				: { ...structuredClone(ref[key]), _errors: [message] }
		) satisfies ErrorList;
	}

	return ve as ValidationErrors<S>;
};
