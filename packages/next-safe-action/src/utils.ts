import type { Schema } from "./adapters/types";
import type { ValidationErrors } from "./validation-errors.types";

export const DEFAULT_SERVER_ERROR_MESSAGE = "Something went wrong while executing the operation.";

export const isError = (error: unknown): error is Error => error instanceof Error;

/**
 * This error is thrown when an action's metadata input is invalid, i.e. when there's a mismatch between the
 * type of the metadata schema returned from `defineMetadataSchema` and the actual input.
 */
export class ActionMetadataError<MDS extends Schema | undefined> extends Error {
	public validationErrors: ValidationErrors<MDS>;

	constructor(validationErrors: ValidationErrors<MDS>) {
		super("Invalid metadata input. Please be sure to pass metadata via `metadata` method before defining the action.");
		this.name = "ActionMetadataError";
		this.validationErrors = validationErrors;
	}
}

/**
 * This error is thrown when an action's data (output) is invalid, i.e. when there's a mismatch between the
 * type of the data schema passed to `dataSchema` method and the actual return of the action.
 */
export class ActionOutputDataError<DS extends Schema | undefined> extends Error {
	public validationErrors: ValidationErrors<DS>;

	constructor(validationErrors: ValidationErrors<DS>) {
		super(
			"Invalid action data (output). Please be sure to return data following the shape of the schema passed to `dataSchema` method."
		);
		this.name = "ActionOutputDataError";
		this.validationErrors = validationErrors;
	}
}
