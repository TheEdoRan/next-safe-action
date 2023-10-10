import type { RedirectError } from "next/dist/client/components/redirect";

export const DEFAULT_SERVER_ERROR = "Something went wrong while executing the operation";

const REDIRECT_ERROR_CODE = "NEXT_REDIRECT";
const NOT_FOUND_ERROR_CODE = "NEXT_NOT_FOUND";

export const isNextRedirectError = <U extends string>(error: any): error is RedirectError<U> => {
	if (typeof (error == null ? void 0 : error.digest) !== "string") return false;
	const [errorCode, type, destination, permanent] = error.digest.split(";", 4);
	return (
		errorCode === REDIRECT_ERROR_CODE &&
		(type === "replace" || type === "push") &&
		typeof destination === "string" &&
		(permanent === "true" || permanent === "false")
	);
};

type NotFoundError = Error & { digest: typeof NOT_FOUND_ERROR_CODE };

export const isNextNotFoundError = (error: any): error is NotFoundError =>
	(error == null ? void 0 : error.digest) === NOT_FOUND_ERROR_CODE;

export const isError = (error: any): error is Error => error instanceof Error;
