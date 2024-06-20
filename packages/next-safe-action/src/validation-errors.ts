/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

import type { ValidationIssue } from "@typeschema/core";
import type { Schema } from "@typeschema/main";
import type {
	FlattenedBindArgsValidationErrors,
	FlattenedValidationErrors,
	ValidationErrors,
} from "./validation-errors.types";

// This function is used internally to build the validation errors object from a list of validation issues.
export const buildValidationErrors = <S extends Schema | undefined>(issues: ValidationIssue[]) => {
	const ve: any = {};

	for (const issue of issues) {
		const { path, message } = issue;

		// When path is undefined or empty, set root errors.
		if (!path || path.length === 0) {
			ve._errors = ve._errors ? [...ve._errors, message] : [message];
			continue;
		}

		// Reference to errors object.
		let ref = ve;

		// Set object for the path, if it doesn't exist.
		for (let i = 0; i < path.length - 1; i++) {
			const k = path[i]!;

			if (!ref[k]) {
				ref[k] = {};
			}

			ref = ref[k];
		}

		// Key is always the last element of the path.
		const key = path[path.length - 1]!;

		// Set error for the current path. If `_errors` array exists, add the message to it.
		ref[key] = ref[key]?._errors
			? {
					...structuredClone(ref[key]),
					_errors: [...ref[key]._errors, message],
				}
			: { ...structuredClone(ref[key]), _errors: [message] };
	}

	return ve as ValidationErrors<S>;
};

// This class is internally used to throw validation errors in action's server code function, using
// `returnValidationErrors`.
export class ActionServerValidationError<S extends Schema> extends Error {
	public kind: string;
	public validationErrors: ValidationErrors<S>;
	constructor(validationErrors: ValidationErrors<S>) {
		super("Server Action server validation error(s) occurred");
		this.validationErrors = validationErrors;
		this.kind = "__actionServerValidationError";
	}
}

// This class is internally used to throw validation errors in action's server code function, using
// `returnValidationErrors`.
export class ActionValidationError<CVE> extends Error {
	public validationErrors: CVE;
	constructor(validationErrors: CVE) {
		super("Server Action validation error(s) occurred");
		this.validationErrors = validationErrors;
	}
}

/**
 * Return custom validation errors to the client from the action's server code function.
 * Code declared after this function invocation will not be executed.
 * @param schema Input schema
 * @param validationErrors Validation errors object
 *
 * {@link https://next-safe-action.dev/docs/recipes/additional-validation-errors#returnvalidationerrors See docs for more information}
 */
export function returnValidationErrors<
	S extends Schema | (() => Promise<Schema>),
	AS extends Schema = S extends () => Promise<Schema> ? Awaited<ReturnType<S>> : S, // actual schema
>(schema: S, validationErrors: ValidationErrors<AS>): never {
	throw new ActionServerValidationError<AS>(validationErrors);
}

/**
 * Default validation errors format.
 * Emulation of `zod`'s [`format`](https://zod.dev/ERROR_HANDLING?id=formatting-errors) function.
 */
export function formatValidationErrors<VE extends ValidationErrors<any>>(validationErrors: VE) {
	return validationErrors;
}

/**
 * Default bind args validation errors format.
 * Emulation of `zod`'s [`format`](https://zod.dev/ERROR_HANDLING?id=formatting-errors) function.
 */
export function formatBindArgsValidationErrors<BAVE extends readonly ValidationErrors<any>[]>(
	bindArgsValidationErrors: BAVE
) {
	return bindArgsValidationErrors;
}

/**
 * Transform default formatted validation errors into flattened structure.
 * `formErrors` contains global errors, and `fieldErrors` contains errors for each field,
 * one level deep. It discards errors for nested fields.
 * Emulation of `zod`'s [`flatten`](https://zod.dev/ERROR_HANDLING?id=flattening-errors) function.
 * @param {ValidationErrors} [validationErrors] Validation errors object
 *
 * {@link https://next-safe-action.dev/docs/recipes/customize-validation-errors-format#flattenvalidationerrors-and-flattenbindargsvalidationerrors-utility-functions See docs for more information}
 */
export function flattenValidationErrors<VE extends ValidationErrors<any>>(validationErrors: VE) {
	const flattened: FlattenedValidationErrors<VE> = {
		formErrors: [],
		fieldErrors: {},
	};

	for (const [key, value] of Object.entries<string[] | { _errors: string[] }>(validationErrors ?? {})) {
		if (key === "_errors" && Array.isArray(value)) {
			flattened.formErrors = [...value];
		} else {
			if ("_errors" in value) {
				flattened.fieldErrors[key as keyof Omit<VE, "_errors">] = [...value._errors];
			}
		}
	}

	return flattened;
}

/**
 * Transform default formatted bind arguments validation errors into flattened structure.
 * `formErrors` contains global errors, and `fieldErrors` contains errors for each field,
 * one level deep. It discards errors for nested fields.
 * Emulation of `zod`'s [`flatten`](https://zod.dev/ERROR_HANDLING?id=flattening-errors) function.
 * @param {ValidationErrors[]} [bindArgsValidationErrors] Bind arguments validation errors object
 *
 * {@link https://next-safe-action.dev/docs/recipes/customize-validation-errors-format#flattenvalidationerrors-and-flattenbindargsvalidationerrors-utility-functions See docs for more information}
 */
export function flattenBindArgsValidationErrors<BAVE extends readonly ValidationErrors<any>[]>(
	bindArgsValidationErrors: BAVE
) {
	return bindArgsValidationErrors.map((ve) => flattenValidationErrors(ve)) as FlattenedBindArgsValidationErrors<BAVE>;
}
