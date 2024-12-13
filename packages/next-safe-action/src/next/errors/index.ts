import { isBailoutToCSRError } from "./bailout-to-csr";
import { isDynamicUsageError } from "./dynamic-usage";
import {
	getAccessFallbackHTTPStatus,
	isHTTPAccessFallbackError,
	type HTTPAccessFallbackError,
} from "./http-access-fallback";
import { isPostpone } from "./postpone";
import { isNextRouterError } from "./router";

export function isNotFoundError(error: unknown): error is HTTPAccessFallbackError {
	return isHTTPAccessFallbackError(error) && getAccessFallbackHTTPStatus(error) === 404;
}

export function isForbiddenError(error: unknown): error is HTTPAccessFallbackError {
	return isHTTPAccessFallbackError(error) && getAccessFallbackHTTPStatus(error) === 403;
}

export function isUnauthorizedError(error: unknown): error is HTTPAccessFallbackError {
	return isHTTPAccessFallbackError(error) && getAccessFallbackHTTPStatus(error) === 401;
}

// Next.js error handling
export function isFrameworkError(error: unknown): error is Error {
	return isNextRouterError(error) || isBailoutToCSRError(error) || isDynamicUsageError(error) || isPostpone(error);
}

export { isRedirectError } from "./redirect";
