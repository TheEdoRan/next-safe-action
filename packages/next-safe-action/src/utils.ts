export const DEFAULT_SERVER_ERROR = "Something went wrong while executing the operation.";

export const isError = (error: unknown): error is Error => error instanceof Error;

// UTIL TYPES

// Returns type or promise of type.
export type MaybePromise<T> = Promise<T> | T;
