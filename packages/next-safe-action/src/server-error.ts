import { decodeDigestPayload, encodeDigestPayload } from "./utils";

// Marker prefixing the `digest` of an `ActionServerError`. Same transport strategy as
// `ActionServerValidationError` (see validation-errors.ts): when the error is thrown inside a
// Next.js `'use cache'` scope, only `message` and `digest` survive the RSC/Flight boundary, so
// the payload is encoded onto the `digest` to be recoverable on the other side.
const SERVER_ERROR_DIGEST = "NEXT_SAFE_ACTION_SERVER_ERROR";

// This class is internally used to return a typed server error from the action's server code
// function or middleware, using `returnServerError`.
class ActionServerError extends Error {
	public digest: string;

	constructor(serverError: unknown) {
		super("Server Action server error occurred");

		this.digest = encodeDigestPayload(
			SERVER_ERROR_DIGEST,
			serverError,
			"The value passed to `returnServerError` must be JSON-serializable (no circular references, BigInts, functions, etc.)."
		);
	}
}

// Recovers the server error payload from an error thrown via `returnServerError`. Always read
// from the `digest`, never from an instance property, so behavior is identical with and without
// `'use cache'` (see `extractServerValidationErrors` in validation-errors.ts for the rationale).
// The payload is wrapped in `{ value }` so legitimately falsy payloads are distinguishable from
// "not a returnServerError error", which returns `undefined`.
export function extractServerError(e: unknown): { value: unknown } | undefined {
	return decodeDigestPayload(SERVER_ERROR_DIGEST, e);
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
