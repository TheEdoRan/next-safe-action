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

	handleError = (e: unknown) => {
		// next/navigation functions work by throwing an error that will be
		// processed internally by Next.js.
		if (FrameworkErrorHandler.isFrameworkError(e)) {
			this.#frameworkError = e;
			return;
		}

		throw e;
	};

	get error() {
		return this.#frameworkError;
	}

	get isRedirectError() {
		return isRedirectError(this.#frameworkError);
	}

	get isNotFoundError() {
		return isHTTPAccessFallbackError(this.#frameworkError) && getAccessFallbackHTTPStatus(this.#frameworkError) === 404;
	}

	get isForbiddenError() {
		return isHTTPAccessFallbackError(this.#frameworkError) && getAccessFallbackHTTPStatus(this.#frameworkError) === 403;
	}

	get isUnauthorizedError() {
		return isHTTPAccessFallbackError(this.#frameworkError) && getAccessFallbackHTTPStatus(this.#frameworkError) === 401;
	}
}
