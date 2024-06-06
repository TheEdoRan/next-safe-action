/* eslint-disable @typescript-eslint/no-floating-promises */

import assert from "node:assert";
import { test } from "node:test";
import { DEFAULT_SERVER_ERROR_MESSAGE, createSafeActionClient } from "../../typeschema";

class ActionError extends Error {
	constructor(message: string) {
		super(message);
	}
}

const ac1 = createSafeActionClient({
	handleServerErrorLog: () => {}, // disable server errors logging for these tests
	handleReturnedServerError(e) {
		if (e instanceof ActionError) {
			return e.message;
		}

		return DEFAULT_SERVER_ERROR_MESSAGE;
	},
});

test("typeschema - unknown error occurred in server code function is masked by default", async () => {
	const action = ac1.action(async () => {
		throw new Error("Something bad happened");
	});

	const actualResult = await action();

	const expectedResult = {
		serverError: DEFAULT_SERVER_ERROR_MESSAGE,
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});

test("typeschema - unknown error occurred in middleware function is masked by default", async () => {
	const action = ac1
		.use(async ({ next, ctx }) => next({ ctx }))
		.use(async () => {
			throw new Error("Something bad happened");
		})
		.action(async () => {
			return {
				ok: true,
			};
		});

	const actualResult = await action();

	const expectedResult = {
		serverError: DEFAULT_SERVER_ERROR_MESSAGE,
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});

test("typeschema - known error occurred in server code function is unmasked", async () => {
	const action = ac1.action(async () => {
		throw new ActionError("Something bad happened");
	});

	const actualResult = await action();

	const expectedResult = {
		serverError: "Something bad happened",
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});

test("typeschema - known error occurred in middleware function is unmasked", async () => {
	const action = ac1
		.use(async ({ next, ctx }) => next({ ctx }))
		.use(async () => {
			throw new ActionError("Something bad happened");
		})
		.action(async () => {
			return {
				ok: true,
			};
		});

	const actualResult = await action();

	const expectedResult = {
		serverError: "Something bad happened",
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});

// Server error is an object with a 'message' property.
const ac2 = createSafeActionClient({
	handleServerErrorLog: () => {}, // disable server errors logging for these tests
	handleReturnedServerError(e) {
		return {
			message: e.message,
		};
	},
});

test("typeschema - error occurred in server code function has the correct shape defined by `handleReturnedServerError`", async () => {
	const action = ac2.action(async () => {
		throw new Error("Something bad happened");
	});

	const actualResult = await action();

	const expectedResult = {
		serverError: { message: "Something bad happened" },
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});

test("typeschema - error occurred in middleware function has the correct shape defined by `handleReturnedServerError`", async () => {
	const action = ac2
		.use(async ({ next, ctx }) => next({ ctx }))
		.use(async () => {
			throw new Error("Something bad happened");
		})
		.action(async () => {
			return {
				ok: true,
			};
		});

	const actualResult = await action();

	const expectedResult = {
		serverError: { message: "Something bad happened" },
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});

// Rethrow all server errors.
const ac3 = createSafeActionClient({
	handleServerErrorLog: () => {}, // disable server errors logging for these tests
	handleReturnedServerError(e) {
		throw e;
	},
});

test("typeschema - action throws if an error occurred in server code function and `handleReturnedServerError` rethrows it", async () => {
	const action = ac3.action(async () => {
		throw new Error("Something bad happened");
	});

	assert.rejects(() => action());
});

test("typeschema - action throws if an error occurred in middleware function and `handleReturnedServerError` rethrows it", async () => {
	const action = ac3
		.use(async ({ next, ctx }) => next({ ctx }))
		.use(async () => {
			throw new Error("Something bad happened");
		})
		.action(async () => {
			return {
				ok: true,
			};
		});

	assert.rejects(() => action());
});
