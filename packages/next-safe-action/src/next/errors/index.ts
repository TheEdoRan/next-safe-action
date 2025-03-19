import type { NavigationType } from "../../index.types";
import { isBailoutToCSRError } from "./bailout-to-csr";
import { isDynamicUsageError } from "./dynamic-usage";
import { getAccessFallbackHTTPStatus, isHTTPAccessFallbackError } from "./http-access-fallback";
import { isPostpone } from "./postpone";
import { isRedirectError } from "./redirect";
import { isNextRouterError } from "./router";

export class FrameworkErrorHandler {
	#frameworkError: Error | undefined;

	static isFrameworkError(error: unknown): error is Error {
		return isNextRouterError(error) || isBailoutToCSRError(error) || isDynamicUsageError(error) || isPostpone(error);
	}

	static getNavigationType(error: Error): NavigationType {
		if (isRedirectError(error)) {
			return "redirect";
		} else if (isHTTPAccessFallbackError(error) && getAccessFallbackHTTPStatus(error) === 404) {
			return "notFound";
		} else if (isHTTPAccessFallbackError(error) && getAccessFallbackHTTPStatus(error) === 403) {
			return "forbidden";
		} else if (isHTTPAccessFallbackError(error) && getAccessFallbackHTTPStatus(error) === 401) {
			return "unauthorized";
		} else {
			return "other";
		}
	}

	// Used in action builder.
	handleError(e: unknown) {
		if (FrameworkErrorHandler.isFrameworkError(e)) {
			this.#frameworkError = e;
			return;
		}

		// If it's not a framework error, rethrow it, so it gets returned as a server error.
		throw e;
	}

	get error() {
		return this.#frameworkError;
	}
}
