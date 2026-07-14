// Marker prefixing the `digest` of an `ActionServerError`. Same transport strategy as
// `ActionServerValidationError` (see validation-errors.ts): when the error is thrown inside a
// Next.js `'use cache'` scope, only `message` and `digest` survive the RSC/Flight boundary, so
// the payload is encoded onto the `digest` to be recoverable on the other side.
const SERVER_ERROR_DIGEST = "NEXT_SAFE_ACTION_SERVER_ERROR";

// This class is internally used to return a typed server error from the action's server code
// function or middleware, using `returnServerError`.
export class ActionServerError extends Error {
	public digest: string;

	constructor(serverError: unknown) {
		super("Server Action server error occurred");

		// The payload is encoded onto the `digest` so it can survive the `'use cache'` RSC boundary,
		// which means it must be JSON-serializable. Fail loudly with a clear message instead of
		// letting a raw `TypeError: Converting circular structure to JSON` leak from the constructor.
		let encoded: string;
		try {
			encoded = JSON.stringify(serverError);
		} catch {
			throw new TypeError(
				"The value passed to `returnServerError` must be JSON-serializable (no circular references, BigInts, functions, etc.)."
			);
		}

		this.digest = `${SERVER_ERROR_DIGEST};${encoded}`;
	}
}

// Recovers the server error payload from an error thrown via `returnServerError`. Always read
// from the `digest`, never from an instance property, so behavior is identical with and without
// `'use cache'` (see `extractServerValidationErrors` in validation-errors.ts for the rationale).
// The payload is wrapped in `{ value }` so legitimately falsy payloads are distinguishable from
// "not a returnServerError error", which returns `undefined`.
export function extractServerError(e: unknown): { value: unknown } | undefined {
	if (typeof e === "object" && e !== null && "digest" in e && typeof e.digest === "string") {
		// Split on the first `;` only, since the JSON payload itself may contain `;`.
		const sep = e.digest.indexOf(";");
		if (sep !== -1 && e.digest.slice(0, sep) === SERVER_ERROR_DIGEST) {
			try {
				return {
					value: JSON.parse(e.digest.slice(sep + 1), (key, value) => (key === "__proto__" ? undefined : value)),
				};
			} catch {
				// Malformed payload: fall through to regular server error handling instead of crashing.
				return undefined;
			}
		}
	}

	return undefined;
}

/**
 * Return a typed, expected server error to the client from the action's server code function or
 * from middleware. Code declared after this function invocation will not be executed.
 *
 * The value is returned to the client as `result.serverError`, bypassing `handleServerError`,
 * so it should conform to the client's `ServerError` type (inferred from `handleServerError`'s
 * return type). It must be JSON-serializable, since it crosses the server/client boundary (and,
 * with `cacheComponents` enabled, the `'use cache'` RSC boundary).
 *
 * @param serverError Server error value returned to the client
 *
 * {@link https://next-safe-action.dev/docs/concepts/error-handling#expected-server-errors-with-returnservererror See docs for more information}
 */
// The generic exists so callers can enforce their app's `ServerError` type at the call site,
// e.g. `returnServerError<AppServerError>({ ... })`.
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters
export function returnServerError<SE>(serverError: SE): never {
	throw new ActionServerError(serverError);
}
