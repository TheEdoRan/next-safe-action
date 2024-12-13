// Comes from https://github.com/vercel/next.js/blob/canary/packages/next/src/client/components/is-next-router-error.ts

import { isHTTPAccessFallbackError, type HTTPAccessFallbackError } from "./http-access-fallback";
import { isRedirectError, type RedirectError } from "./redirect";

/**
 * Returns true if the error is a navigation signal error. These errors are
 * thrown by user code to perform navigation operations and interrupt the React
 * render.
 */
export function isNextRouterError(error: unknown): error is RedirectError | HTTPAccessFallbackError {
	return isRedirectError(error) || isHTTPAccessFallbackError(error);
}
