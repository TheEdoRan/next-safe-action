export const DEFAULT_SERVER_ERROR_MESSAGE = "Something went wrong while executing the operation.";

export const isError = (error: unknown): error is Error => error instanceof Error;
