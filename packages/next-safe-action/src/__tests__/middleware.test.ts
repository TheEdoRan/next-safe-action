/* eslint-disable @typescript-eslint/no-floating-promises */

import assert from "node:assert";
import { test } from "node:test";
import { z } from "zod";
import {
	createMiddleware,
	createSafeActionClient,
	DEFAULT_SERVER_ERROR_MESSAGE,
	formatBindArgsValidationErrors,
	formatValidationErrors,
	returnValidationErrors,
} from "..";
import { zodAdapter } from "../adapters/zod";

const ac = createSafeActionClient({
	validationAdapter: zodAdapter(),
	handleServerError(e) {
		// disable server error logging for these tests
		return {
			message: e.message,
		};
	},
}).use(async ({ next }) => {
	return next({ ctx: { foo: "bar" } });
});

test("instance context value is accessible in server code function", async () => {
	const action = ac.action(async ({ ctx }) => {
		return {
			ctx,
		};
	});

	const actualResult = await action();
	const expectedResult = {
		data: {
			ctx: { foo: "bar" },
		},
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});

test("instance context value is extended in action middleware and both values are accessible in server code function", async () => {
	const action = ac
		.use(async ({ next }) => {
			return next({ ctx: { bar: "baz" } });
		})
		.action(async ({ ctx }) => {
			return {
				ctx,
			};
		});

	const actualResult = await action();
	const expectedResult = {
		data: {
			ctx: { foo: "bar", bar: "baz" },
		},
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});

test("instance context value is correctly overridden in subsequent middleware", async () => {
	const action = ac
		.use(async ({ next }) => {
			return next({ ctx: { foo: "baz" } });
		})
		.use(async ({ ctx, next }) => {
			if (ctx.foo !== "baz") {
				throw new Error("Expected ctx.foo to be 'baz'");
			}
			return next();
		})
		.action(async ({ ctx }) => {
			return {
				ctx,
			};
		});

	const actualResult = await action();
	const expectedResult = {
		data: {
			ctx: { foo: "baz" },
		},
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});

test("action client inputs are passed to middleware", async () => {
	const action = ac
		.schema(async () =>
			z.object({
				username: z.string(),
			})
		)
		.bindArgsSchemas([z.object({ age: z.number().positive() })])
		.use(async ({ clientInput, bindArgsClientInputs, next }) => {
			return next({ ctx: { clientInput, bindArgsClientInputs } });
		})
		.action(async ({ ctx }) => {
			return {
				clientInput: ctx.clientInput,
				bindArgsClientInputs: ctx.bindArgsClientInputs,
			};
		});

	const inputs = [{ age: 30 }, { username: "johndoe" }] as const;

	const actualResult = await action(...inputs);

	const expectedResult = {
		data: {
			bindArgsClientInputs: [inputs[0]],
			clientInput: inputs[1],
		},
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});

test("happy path execution result from middleware is correct", async () => {
	let middlewareResult = {};

	const action = ac
		.schema(async () =>
			z.object({
				username: z.string(),
			})
		)
		.bindArgsSchemas([z.object({ age: z.number().positive() })])
		.use(async ({ next }) => {
			// Await action execution.
			const res = await next();
			middlewareResult = res;
			return res;
		})
		.action(async () => {
			return {
				ok: "123",
			};
		});

	const inputs = [{ age: 30 }, { username: "johndoe" }] as const;
	await action(...inputs);

	const expectedResult = {
		success: true,
		ctx: {
			foo: "bar",
		},
		data: {
			ok: "123",
		},
		parsedInput: {
			username: "johndoe",
		},
		bindArgsParsedInputs: [
			{
				age: 30,
			},
		],
	};

	assert.deepStrictEqual(middlewareResult, expectedResult);
});

test("server error execution result from middleware is correct", async () => {
	let middlewareResult = {};

	const action = ac
		.schema(async () =>
			z.object({
				username: z.string(),
			})
		)
		.bindArgsSchemas([z.object({ age: z.number().positive() })])
		.use(async ({ next }) => {
			// Await action execution.
			const res = await next();
			middlewareResult = res;
			return res;
		})
		.action(async () => {
			throw new Error("Server error message");
		});

	const inputs = [{ age: 30 }, { username: "johndoe" }] as const;
	await action(...inputs);

	const expectedResult = {
		success: false,
		ctx: {
			foo: "bar",
		},
		serverError: {
			message: "Server error message",
		},
	};

	assert.deepStrictEqual(middlewareResult, expectedResult);
});

test("validation errors in execution result from middleware are correct", async () => {
	let middlewareResult = {};

	const action = ac
		.schema(async () =>
			z.object({
				username: z.string().max(3),
			})
		)
		.bindArgsSchemas([z.object({ age: z.number().positive() })])
		.use(async ({ next }) => {
			// Await action execution.
			const res = await next();
			middlewareResult = res;
			return res;
		})
		.action(async () => {
			return {
				ok: "123",
			};
		});

	const inputs = [{ age: -30 }, { username: "johndoe" }] as const;
	await action(...inputs);

	const expectedResult = {
		success: false,
		ctx: {
			foo: "bar",
		},
		validationErrors: {
			username: {
				_errors: ["String must contain at most 3 character(s)"],
			},
		},
		bindArgsValidationErrors: [
			{
				age: {
					_errors: ["Number must be greater than 0"],
				},
			},
		],
	};

	assert.deepStrictEqual(middlewareResult, expectedResult);
});

test("server validation errors in execution result from middleware are correct", async () => {
	let middlewareResult = {};

	const schema = z.object({
		username: z.string(),
	});

	const action = ac
		.schema(schema)
		.bindArgsSchemas([z.object({ age: z.number().positive() })])
		.use(async ({ next }) => {
			// Await action execution.
			const res = await next();
			middlewareResult = res;
			return res;
		})
		.action(async () => {
			returnValidationErrors(schema, {
				username: {
					_errors: ["User suspended"],
				},
			});
		});

	const inputs = [{ age: 30 }, { username: "johndoe" }] as const;
	await action(...inputs);

	const expectedResult = {
		success: false,
		ctx: {
			foo: "bar",
		},
		validationErrors: {
			username: {
				_errors: ["User suspended"],
			},
		},
	};

	assert.deepStrictEqual(middlewareResult, expectedResult);
});

// Flattened validation errors shape.

const flac = createSafeActionClient({
	validationAdapter: zodAdapter(),
	handleServerError: () => DEFAULT_SERVER_ERROR_MESSAGE, // disable server errors logging for these tests
	defaultValidationErrorsShape: "flattened",
});

test("flattened validation errors in execution result from middleware are correct", async () => {
	let middlewareResult = {};

	const action = flac
		.schema(async () =>
			z.object({
				username: z.string().max(3),
			})
		)
		.bindArgsSchemas([z.object({ age: z.number().positive() })])
		.use(async ({ next }) => {
			// Await action execution.
			const res = await next();
			middlewareResult = res;
			return res;
		})
		.action(async () => {
			return {
				ok: "123",
			};
		});

	const inputs = [{ age: -30 }, { username: "johndoe" }] as const;
	await action(...inputs);

	const expectedResult = {
		success: false,
		ctx: {},
		validationErrors: {
			formErrors: [],
			fieldErrors: {
				username: ["String must contain at most 3 character(s)"],
			},
		},
		bindArgsValidationErrors: [
			{
				formErrors: [],
				fieldErrors: {
					age: ["Number must be greater than 0"],
				},
			},
		],
	};

	assert.deepStrictEqual(middlewareResult, expectedResult);
});

test("overridden formatted validation errors in execution result from middleware are correct", async () => {
	let middlewareResult = {};

	const action = flac
		.schema(
			async () =>
				z.object({
					username: z.string().max(3),
				}),
			{ handleValidationErrorsShape: formatValidationErrors }
		)
		.bindArgsSchemas([z.object({ age: z.number().positive() })], {
			handleBindArgsValidationErrorsShape: formatBindArgsValidationErrors,
		})
		.use(async ({ next }) => {
			// Await action execution.
			const res = await next();
			middlewareResult = res;
			return res;
		})
		.action(async () => {
			return {
				ok: "123",
			};
		});

	const inputs = [{ age: -30 }, { username: "johndoe" }] as const;
	await action(...inputs);

	const expectedResult = {
		success: false,
		ctx: {},
		validationErrors: {
			username: {
				_errors: ["String must contain at most 3 character(s)"],
			},
		},
		bindArgsValidationErrors: [
			{
				age: {
					_errors: ["Number must be greater than 0"],
				},
			},
		],
	};

	assert.deepStrictEqual(middlewareResult, expectedResult);
});

test("standalone middleware extends context", async () => {
	const myMiddleware = createMiddleware<{ ctx: { foo: string } }>().define(async ({ next }) => {
		return next({ ctx: { baz: "qux" } });
	});

	const action = ac.use(myMiddleware).action(async ({ ctx }) => {
		return {
			ctx,
		};
	});

	const actualResult = await action();
	const expectedResult = {
		data: {
			ctx: { foo: "bar", baz: "qux" },
		},
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});
