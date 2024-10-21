export const DEFAULT_SERVER_ERROR_MESSAGE = "Something went wrong while executing the operation.";

/**
 * Checks if passed argument is an instance of Error.
 */
export const isError = (error: unknown): error is Error => error instanceof Error;

/**
 * Checks what the winning boolean value is from a series of values, from lowest to highest priority.
 * `null` and `undefined` values are skipped.
 */
export const winningBoolean = (...args: (boolean | undefined | null)[]) => {
	return args.reduce((acc, v) => (typeof v === "boolean" ? v : acc), false) as boolean;
};
