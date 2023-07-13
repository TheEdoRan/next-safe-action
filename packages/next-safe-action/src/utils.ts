export const isNextRedirectError = (e: any) => e instanceof Error && e.message === "NEXT_REDIRECT";
export const isNextNotFoundError = (e: any) => e instanceof Error && e.message === "NEXT_NOT_FOUND";
