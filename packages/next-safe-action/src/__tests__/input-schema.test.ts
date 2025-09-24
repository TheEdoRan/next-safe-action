/* eslint-disable @typescript-eslint/no-floating-promises */

import assert from "node:assert";
import { test } from "node:test";
import { z } from "zod";
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "..";

const ac = createSafeActionClient();

test("inputSchema with clientInput parameter receives actual input data", async () => {
	let receivedClientInput: unknown;
	
	const action = ac
		.inputSchema(async (clientInput: any) => {
			receivedClientInput = clientInput;
			return z.object({ message: z.string() });
		})
		.action(async ({ parsedInput }) => {
			return { success: true, data: parsedInput };
		});

	const testData = { message: "Hello World" };
	const result = await action(testData);

	assert.deepStrictEqual(receivedClientInput, testData);
	assert.deepStrictEqual(result, { data: { success: true, data: testData } });
});

test("inputSchema chaining with prevSchema and clientInput works correctly", async () => {
	let receivedPrevSchema: unknown;
	let receivedClientInput: unknown;

	const action = ac
		.inputSchema(async (clientInput: any) => {
			return z.object({ name: z.string() });
		})
		.inputSchema(async (prevSchema, clientInput) => {
			receivedPrevSchema = prevSchema;
			receivedClientInput = clientInput;
			return prevSchema.extend({ age: z.number() });
		})
		.action(async ({ parsedInput }) => {
			return { success: true, data: parsedInput };
		});

	const testData = { name: "John", age: 25 };
	const result = await action(testData);

	assert.ok(receivedPrevSchema); // Should be a Zod schema object
	assert.deepStrictEqual(receivedClientInput, testData);
	assert.deepStrictEqual(result, { data: { success: true, data: testData } });
});

test("inputSchema chaining validates against extended schema", async () => {
	const action = ac
		.inputSchema(async () => {
			return z.object({ name: z.string() });
		})
		.inputSchema(async (prevSchema, clientInput) => {
			return prevSchema.extend({ age: z.number() });
		})
		.action(async ({ parsedInput }) => {
			return { success: true, data: parsedInput };
		});

	// Valid data should work
	const validResult = await action({ name: "John", age: 25 });
	assert.deepStrictEqual(validResult, { data: { success: true, data: { name: "John", age: 25 } } });

	// Invalid data should return validation errors
	// @ts-expect-error
	const invalidResult = await action({ name: "Jane" }); // Missing age
	assert.ok(invalidResult.validationErrors);
	assert.ok(invalidResult.validationErrors.age);
});

test("inputSchema with clientInput can build dynamic Zod schema", async () => {
	const action = ac
		.inputSchema(async (clientInput: any) => {
			if ((clientInput as { type: string })?.type === "user") {
				return z.object({
					type: z.literal("user"),
					name: z.string(),
					email: z.string().email(),
				});
			}
			
			return z.object({
				type: z.string(),
				data: z.any(),
			});
		})
		.action(async ({ parsedInput }) => {
			return { success: true, data: parsedInput };
		});

	const userResult = await action({ type: "user", name: "John", email: "john@example.com" });
	assert.deepStrictEqual(userResult, {
		data: { success: true, data: { type: "user", name: "John", email: "john@example.com" } }
	});

	
	const defaultResult = await action({ type: "other", data: "anything" });
	assert.deepStrictEqual(defaultResult, {
		data: { success: true, data: { type: "other", data: "anything" } }
	});
});

test("inputSchema function throws error when clientInput is invalid", async () => {
	const action = ac
		.inputSchema(async (clientInput: any) => {
			// Throw error if clientInput is missing required field
			if (!clientInput?.type) {
				throw new Error("Missing required field: type");
			}
			
			return z.object({
				type: z.string(),
				data: z.any(),
			});
		})
		.action(async ({ parsedInput }) => {
			return { success: true, data: parsedInput };
		});

	// Test with missing type field - should throw
    // @ts-expect-error
	const result = await action({ data: "some data" });
	
	// Should return server error when inputSchema function throws
	assert.deepStrictEqual(result, {
		serverError: DEFAULT_SERVER_ERROR_MESSAGE
	});
});
