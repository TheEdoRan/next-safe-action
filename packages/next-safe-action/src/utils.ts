export const isError = (e: any) => e instanceof Error;
export const isNextRedirectError = (e: any) => isError(e) && e.message === "NEXT_REDIRECT";
export const isNextNotFoundError = (e: any) => isError(e) && e.message === "NEXT_NOT_FOUND";
