import type { Infer, Schema } from "./validation-adapters";

export const DEFAULT_SERVER_ERROR_MESSAGE = "Something went wrong while executing the operation.";

export const isError = (error: unknown): error is Error => error instanceof Error;

// Validate with Zod.
export async function zodValidate<S extends Schema>(s: S, data: unknown) {
	const result = await s.safeParseAsync(data);

	if (result.success) {
		return {
			success: true,
			data: result.data as Infer<S>,
		} as const;
	}

	return {
		success: false,
		issues: result.error.issues.map(({ message, path }) => ({ message, path })),
	} as const;
}

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
