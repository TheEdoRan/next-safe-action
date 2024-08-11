export const DEFAULT_SERVER_ERROR_MESSAGE = "Something went wrong while executing the operation.";

export const isError = (error: unknown): error is Error => error instanceof Error;

export const deepMerge = (obj1: object, obj2: object) => {
	for (const key of Object.keys(obj2)) {
		const k = key as keyof typeof obj2;
		// eslint-disable-next-line
		if (typeof obj2[k] === "object" && Object.hasOwn(obj1, k)) {
			// @ts-expect-error
			if (!obj1[k]) obj1[k] = {};
			deepMerge(obj1[k], obj2[k]);
		} else {
			obj1[k] = obj2[k];
		}
	}

	return obj1;
};

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
