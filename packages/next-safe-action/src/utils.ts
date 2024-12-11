import type { HTTPAccessFallbackError } from "next/dist/client/components/http-access-fallback/http-access-fallback.js";
import {
	getAccessFallbackHTTPStatus,
	isHTTPAccessFallbackError,
} from "next/dist/client/components/http-access-fallback/http-access-fallback.js";
import { isNextRouterError } from "next/dist/client/components/is-next-router-error.js";
import { isRedirectError } from "next/dist/client/components/redirect-error.js";
import { isDynamicUsageError } from "next/dist/export/helpers/is-dynamic-usage-error.js";
import { isPostpone } from "next/dist/server/lib/router-utils/is-postpone.js";
import { isBailoutToCSRError } from "next/dist/shared/lib/lazy-dynamic/bailout-to-csr.js";

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

// Next.js error handling
export function isFrameworkError(error: unknown): error is Error {
	return isNextRouterError(error) || isBailoutToCSRError(error) || isDynamicUsageError(error) || isPostpone(error);
}

export function isNotFoundError(error: unknown): error is HTTPAccessFallbackError {
	return isHTTPAccessFallbackError(error) && getAccessFallbackHTTPStatus(error) === 404;
}

export function isForbiddenError(error: unknown): error is HTTPAccessFallbackError {
	return isHTTPAccessFallbackError(error) && getAccessFallbackHTTPStatus(error) === 403;
}

export function isUnauthorizedError(error: unknown): error is HTTPAccessFallbackError {
	return isHTTPAccessFallbackError(error) && getAccessFallbackHTTPStatus(error) === 401;
}

export { isRedirectError };
