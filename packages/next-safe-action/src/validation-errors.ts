import type { ValidationIssue } from "@typeschema/core";
import type { Schema } from "@typeschema/main";
import type {
	ErrorList,
	FlattenedBindArgsValidationErrors,
	FlattenedValidationErrors,
	ValidationErrors,
} from "./validation-errors.types";

// This function is used internally to build the validation errors object from a list of validation issues.
export const buildValidationErrors = <const S extends Schema>(issues: ValidationIssue[]) => {
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
		ref[key] = (
			ref[key]?._errors
				? {
						...structuredClone(ref[key]),
						_errors: [...ref[key]._errors, message],
					}
				: { ...structuredClone(ref[key]), _errors: [message] }
		) satisfies ErrorList;
	}

	return ve as ValidationErrors<S>;
};

// This class is internally used to throw validation errors in action's server code function, using
// `returnValidationErrors`.
export class ServerValidationError<S extends Schema> extends Error {
	public validationErrors: ValidationErrors<S>;
	constructor(validationErrors: ValidationErrors<S>) {
		super("Server Validation Error");
		this.validationErrors = validationErrors;
	}
}

/**
 * Return custom validation errors to the client from the action's server code function.
 * Code declared after this function invocation will not be executed.
 * @param schema Input schema
 * @param validationErrors Validation errors object
 * @throws {ServerValidationError}
 */
export function returnValidationErrors<S extends Schema>(
	schema: S,
	validationErrors: ValidationErrors<S>
): never {
	throw new ServerValidationError<S>(validationErrors);
}

/**
 * Transform default formatted validation errors into flattened structure.
 * `formErrors` contains global errors, and `fieldErrors` contains errors for each field,
 * one level deep. It discards errors for nested fields.
 * Emulation of `zod`'s [`flatten`](https://zod.dev/ERROR_HANDLING?id=flattening-errors) function.
 * @param {ValidationErrors} [validationErrors] Validation errors object
 * @returns {FlattenedValidationErrors} Flattened validation errors
 */
export function flattenValidationErrors<const VE extends ValidationErrors<any>>(
	validationErrors: VE
) {
	const flattened: FlattenedValidationErrors<VE> = {
		formErrors: [],
		fieldErrors: {},
	};

	for (const [key, value] of Object.entries<string[] | { _errors: string[] }>(validationErrors)) {
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
 * @returns {FlattenedBindArgsValidationErrors} Flattened bind arguments validation errors
 */
export function flattenBindArgsValidationErrors<
	const BAVE extends readonly ValidationErrors<any>[],
>(bindArgsValidationErrors: BAVE) {
	return bindArgsValidationErrors.map((ve) =>
		flattenValidationErrors(ve)
	) as FlattenedBindArgsValidationErrors<BAVE>;
}
