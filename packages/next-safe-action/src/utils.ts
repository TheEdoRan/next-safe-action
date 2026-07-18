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

// Shared digest transport for `returnValidationErrors` and `returnServerError` errors: the payload
// is JSON-encoded onto the error `digest` (as `${marker};${json}`) so it survives the Next.js
// `'use cache'` RSC/Flight boundary, which preserves only `message` and `digest` (and the digest
// verbatim, see `create-error-handler` in Next.js). Internal, not part of the public API.

// Encodes a payload onto a digest string. Throws a `TypeError` with the given message when the
// payload is not JSON-serializable, instead of letting a raw serialization error leak.
export function encodeDigestPayload(marker: string, payload: unknown, nonSerializableMessage: string): string {
	// Note: `JSON.stringify` returns `undefined` (it does not throw) for a top-level `undefined`,
	// function, or symbol, so that case needs an explicit check besides the try/catch.
	let encoded: string | undefined;
	try {
		encoded = JSON.stringify(payload);
	} catch {
		encoded = undefined;
	}

	if (typeof encoded === "undefined") {
		throw new TypeError(nonSerializableMessage);
	}

	return `${marker};${encoded}`;
}

// Recovers a payload encoded with `encodeDigestPayload` from an unknown thrown error. The payload
// is wrapped in `{ value }` so legitimately falsy payloads are distinguishable from "not encoded
// with this marker", which returns `undefined`.
export function decodeDigestPayload(marker: string, e: unknown): { value: unknown } | undefined {
	if (typeof e === "object" && e !== null && "digest" in e && typeof e.digest === "string") {
		// Split on the first `;` only, since the JSON payload itself may contain `;`.
		const sep = e.digest.indexOf(";");
		if (sep !== -1 && e.digest.slice(0, sep) === marker) {
			try {
				// The `__proto__` reviver is defense-in-depth against prototype pollution: `JSON.parse`
				// already stores `__proto__` as a plain own property (it does not pollute the global
				// prototype), but dropping it keeps a hostile key out of the recovered object entirely.
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
