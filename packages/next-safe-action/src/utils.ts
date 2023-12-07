export const DEFAULT_SERVER_ERROR = "Something went wrong while executing the operation";
export const isError = (error: any): error is Error => error instanceof Error;
