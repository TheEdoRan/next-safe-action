import { expect, test, vi } from "vitest";
import { z } from "zod";
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE, returnServerError } from "..";

// Simulates what Next.js does to an error thrown inside a `'use cache'` scope
// (with `cacheComponents` enabled): the error crosses the RSC/Flight boundary,
// which preserves only `message` and `digest` while dropping the class prototype
// and every other own property. See returnvalidationerrors.test.ts and issue #452.
function throwAsThroughUseCacheBoundary(fn: () => never): never {
	try {
		fn();
	} catch (e) {
		const stripped = new Error((e as Error).message);
		(stripped as { digest?: string }).digest = (e as { digest?: string }).digest;
		throw stripped;
	}
}

type AppServerError = { code: string; message: string };

const ac = createSafeActionClient({
	handleServerError: (e): AppServerError => ({ code: "INTERNAL", message: e.message }),
});

test("returnServerError returns the typed payload as serverError, bypassing handleServerError", async () => {
	const handleServerError = vi.fn((e: Error): AppServerError => ({ code: "INTERNAL", message: e.message }));
	const client = createSafeActionClient({ handleServerError });

	const action = client.inputSchema(z.object({ id: z.string() })).action(async ({ parsedInput }) => {
		if (parsedInput.id === "missing") {
			returnServerError({ code: "NOT_FOUND", message: `No entity with id ${parsedInput.id}` });
		}

		return { ok: true };
	});

	const actualResult = await action({ id: "missing" });

	expect(actualResult).toStrictEqual({
		serverError: { code: "NOT_FOUND", message: "No entity with id missing" },
	});
	expect(handleServerError).not.toHaveBeenCalled();
});

test("action returns data when returnServerError condition is not met", async () => {
	const action = ac.inputSchema(z.object({ id: z.string() })).action(async ({ parsedInput }) => {
		if (parsedInput.id === "missing") {
			returnServerError({ code: "NOT_FOUND", message: "not found" });
		}

		return { ok: true };
	});

	const actualResult = await action({ id: "existing" });

	expect(actualResult).toStrictEqual({ data: { ok: true } });
});

test("returnServerError works from a middleware catch block when handleServerError rethrows", async () => {
	const client = createSafeActionClient({
		handleServerError: (e) => {
			throw e;
		},
	});

	const action = client
		.use(async ({ next }) => {
			try {
				return await next();
			} catch (e) {
				if (e instanceof RangeError) {
					returnServerError({ code: "MIDDLEWARE", message: "converted" });
				}

				throw e;
			}
		})
		.action(async () => {
			throw new RangeError("boom");
		});

	const actualResult = await action();

	expect(actualResult).toStrictEqual({
		serverError: { code: "MIDDLEWARE", message: "converted" },
	});
});

test("returnServerError works even when handleServerError rethrows", async () => {
	const client = createSafeActionClient({
		handleServerError: (e) => {
			throw e;
		},
	});

	const action = client.action(async () => {
		returnServerError({ code: "EXPECTED", message: "expected error" });
	});

	const actualResult = await action();

	expect(actualResult).toStrictEqual({
		serverError: { code: "EXPECTED", message: "expected error" },
	});
});

test("returnServerError payload is thrown as-is when throwServerError is true", async () => {
	const action = ac.action(
		async () => {
			returnServerError({ code: "EXPECTED", message: "expected error" });
		},
		{ throwServerError: true }
	);

	await expect(action()).rejects.toStrictEqual({ code: "EXPECTED", message: "expected error" });
});

test("returnServerError thrown across a 'use cache' boundary still returns the typed serverError", async () => {
	const action = ac.action(async () => {
		throwAsThroughUseCacheBoundary(() => returnServerError({ code: "NOT_FOUND", message: "gone" }));
	});

	const actualResult = await action();

	expect(actualResult).toStrictEqual({
		serverError: { code: "NOT_FOUND", message: "gone" },
	});
});

test("returnServerError supports falsy and primitive payloads", async () => {
	const client = createSafeActionClient();

	const action = client.action(async () => {
		returnServerError(null);
	});

	const actualResult = await action();

	expect(actualResult).toStrictEqual({ serverError: null });
});

test("returnServerError with a non-JSON-serializable payload fails clearly instead of silently", async () => {
	const handleServerError = vi.fn((e: Error) => e.message);
	const client = createSafeActionClient({ handleServerError });

	const circular: { self?: unknown } = {};
	circular.self = circular;

	const action = client.action(async () => {
		returnServerError(circular);
	});

	const actualResult = await action();

	expect(actualResult).toStrictEqual({
		serverError:
			"The value passed to `returnServerError` must be JSON-serializable (no circular references, BigInts, functions, etc.).",
	});
	expect(handleServerError).toHaveBeenCalledOnce();
});

test("payloads with delimiters and special characters survive the digest round-trip", async () => {
	const payload = { code: "WEIRD;CODE", message: 'quotes " and ; semicolons ; and unicode ✓' };

	const action = ac.action(async () => {
		returnServerError(payload);
	});

	const actualResult = await action();

	expect(actualResult).toStrictEqual({ serverError: payload });
});

test("a genuine server error carrying a Next.js-generated digest is NOT treated as an expected server error", async () => {
	const client = createSafeActionClient({
		handleServerError: () => DEFAULT_SERVER_ERROR_MESSAGE,
	});

	const action = client.action(async () => {
		const e = new Error("boom");
		(e as { digest?: string }).digest = "123456789";
		throw e;
	});

	const actualResult = await action();

	expect(actualResult).toStrictEqual({ serverError: DEFAULT_SERVER_ERROR_MESSAGE });
});

test("a hostile `__proto__` key in a recovered payload does not pollute Object.prototype", async () => {
	const action = ac.action(async () => {
		const e = new Error("Server Action server error occurred");
		(e as { digest?: string }).digest = `NEXT_SAFE_ACTION_SERVER_ERROR;{"__proto__":{"polluted":true},"code":"X"}`;
		throw e;
	});

	const actualResult = await action();

	expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
	expect(actualResult).toStrictEqual({ serverError: { code: "X" } });
});
