export const DEFAULT_SERVER_ERROR_MESSAGE = "Something went wrong while executing the operation.";

export const isError = (error: unknown): error is Error => error instanceof Error;

/**
 * This error is thrown when an action's metadata input is invalid, i.e. when there's a mismatch between the
 * type of the metadata schema returned from `defineMetadataSchema` and the actual input.
 */
export class ActionMetadataError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ActionMetadataError";
	}
}
