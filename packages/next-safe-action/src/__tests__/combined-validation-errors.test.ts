/* eslint-disable @typescript-eslint/no-floating-promises */

import assert from "node:assert";
import { test } from "node:test";
import { z } from "zod";
import {
	createSafeActionClient,
	flattenBindArgsValidationErrors,
	flattenValidationErrors,
	formatBindArgsValidationErrors,
	formatValidationErrors,
} from "..";

// Default client tests.

const dac = createSafeActionClient();

test("action with invalid bind args input and valid main input gives back an object with correct `bindArgsValidationErrors` (default formatted shape)", async () => {
	const schema = z.object({
		username: z.string().min(3),
	});

	const bindArgsSchemas: [age: z.ZodNumber, userId: z.ZodString, product: z.ZodObject<{ id: z.ZodString }>] = [
		z.number().positive(),
		z.string().uuid(),
		z.object({
			id: z.string().uuid(),
		}),
	];

	const action = dac
		.schema(schema)
		.bindArgsSchemas(bindArgsSchemas)
		.action(async () => {
			return {
				ok: true,
			};
		});

	const actualResult = await action(-123, crypto.randomUUID(), { id: "invalid_uuid" }, { username: "johndoe" });

	const expectedResult = {
		bindArgsValidationErrors: [
			{
				_errors: ["Number must be greater than 0"],
			},
			{},
			{
				id: {
					_errors: ["Invalid uuid"],
				},
			},
		],
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});

test("action with invalid bind args input and invalid main input gives back an object with correct `validationErrors` and `bindArgsValidationErrors` (default formatted shape overridden by custom bind args errors flattened shape)", async () => {
	const schema = z.object({
		username: z.string().min(3),
	});

	const bindArgsSchemas: [age: z.ZodNumber, userId: z.ZodString, product: z.ZodObject<{ id: z.ZodString }>] = [
		z.number().positive(),
		z.string().uuid(),
		z.object({
			id: z.string().uuid(),
		}),
	];

	const action = dac
		.schema(schema)
		.bindArgsSchemas(bindArgsSchemas, {
			handleBindArgsValidationErrorsShape: async (ve) => flattenBindArgsValidationErrors(ve),
		})
		.action(async () => {
			return {
				ok: true,
			};
		});

	const actualResult = await action(-123, crypto.randomUUID(), { id: "invalid_uuid" }, { username: "" });

	const expectedResult = {
		validationErrors: {
			username: {
				_errors: ["String must contain at least 3 character(s)"],
			},
		},
		bindArgsValidationErrors: [
			{
				formErrors: ["Number must be greater than 0"],
				fieldErrors: {},
			},
			{
				formErrors: [],
				fieldErrors: {},
			},
			{
				formErrors: [],
				fieldErrors: {
					id: ["Invalid uuid"],
				},
			},
		],
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});

// Formatted shape tests (same as default).

const foac = createSafeActionClient({
	defaultValidationErrorsShape: "formatted",
});

test("action with invalid bind args input and invalid main input gives back an object with correct `validationErrors` and `bindArgsValidationErrors` (set formatted shape overridden by custom main input flattened shape)", async () => {
	const schema = z.object({
		username: z.string().min(3),
	});

	const bindArgsSchemas: [age: z.ZodNumber, userId: z.ZodString, product: z.ZodObject<{ id: z.ZodString }>] = [
		z.number().positive(),
		z.string().uuid(),
		z.object({
			id: z.string().uuid(),
		}),
	];

	const action = foac
		.schema(schema, { handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve) })
		.bindArgsSchemas(bindArgsSchemas)
		.action(async () => {
			return {
				ok: true,
			};
		});

	const actualResult = await action(-123, crypto.randomUUID(), { id: "invalid_uuid" }, { username: "" });

	const expectedResult = {
		validationErrors: {
			formErrors: [],
			fieldErrors: {
				username: ["String must contain at least 3 character(s)"],
			},
		},
		bindArgsValidationErrors: [
			{
				_errors: ["Number must be greater than 0"],
			},
			{},
			{
				id: {
					_errors: ["Invalid uuid"],
				},
			},
		],
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});

test("action with invalid bind args input and valid main input gives back an object with correct `bindArgsValidationErrors` (set formatted shape overridden by custom bind args flattened shape)", async () => {
	const schema = z.object({
		username: z.string().min(3),
	});

	const bindArgsSchemas: [age: z.ZodNumber, userId: z.ZodString, product: z.ZodObject<{ id: z.ZodString }>] = [
		z.number().positive(),
		z.string().uuid(),
		z.object({
			id: z.string().uuid(),
		}),
	];

	const action = foac
		.schema(schema)
		.bindArgsSchemas(bindArgsSchemas, {
			handleBindArgsValidationErrorsShape: async (ve) => flattenBindArgsValidationErrors(ve),
		})
		.action(async () => {
			return {
				ok: true,
			};
		});

	const actualResult = await action(-123, crypto.randomUUID(), { id: "invalid_uuid" }, { username: "johndoe" });

	const expectedResult = {
		bindArgsValidationErrors: [
			{
				formErrors: ["Number must be greater than 0"],
				fieldErrors: {},
			},
			{
				formErrors: [],
				fieldErrors: {},
			},
			{
				formErrors: [],
				fieldErrors: {
					id: ["Invalid uuid"],
				},
			},
		],
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});

// Flattened shape tests.

const flac = createSafeActionClient({
	defaultValidationErrorsShape: "flattened",
});

test("action with invalid bind args input and invalid main input gives back an object with correct `bindArgsValidationErrors` (set flattened shape)", async () => {
	const schema = z.object({
		username: z.string().min(3),
	});

	const bindArgsSchemas: [age: z.ZodNumber, userId: z.ZodString, product: z.ZodObject<{ id: z.ZodString }>] = [
		z.number().positive(),
		z.string().uuid(),
		z.object({
			id: z.string().uuid(),
		}),
	];

	const action = flac
		.schema(schema)
		.bindArgsSchemas(bindArgsSchemas)
		.action(async () => {
			return {
				ok: true,
			};
		});

	const actualResult = await action(-123, crypto.randomUUID(), { id: "invalid_uuid" }, { username: "" });

	const expectedResult = {
		validationErrors: {
			formErrors: [],
			fieldErrors: {
				username: ["String must contain at least 3 character(s)"],
			},
		},
		bindArgsValidationErrors: [
			{
				formErrors: ["Number must be greater than 0"],
				fieldErrors: {},
			},
			{
				formErrors: [],
				fieldErrors: {},
			},
			{
				formErrors: [],
				fieldErrors: {
					id: ["Invalid uuid"],
				},
			},
		],
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});

test("action with invalid bind args input, invalid main input and root level schema error gives back an object with correct `bindArgsValidationErrors` (set flattened shape overridden by custom formatted shape)", async () => {
	const schema = z
		.object({
			username: z.string().min(3),
		})
		.refine(() => false, {
			message: "Root schema error",
		});

	const bindArgsSchemas: [age: z.ZodNumber, userId: z.ZodString, product: z.ZodObject<{ id: z.ZodString }>] = [
		z.number().positive(),
		z.string().uuid(),
		z.object({
			id: z.string().uuid(),
		}),
	];

	const action = flac
		.schema(schema, { handleValidationErrorsShape: async (ve) => formatValidationErrors(ve) })
		.bindArgsSchemas(bindArgsSchemas, {
			handleBindArgsValidationErrorsShape: async (ve) => formatBindArgsValidationErrors(ve),
		})
		.action(async () => {
			return {
				ok: true,
			};
		});

	const actualResult = await action(-123, crypto.randomUUID(), { id: "invalid_uuid" }, { username: "" });

	const expectedResult = {
		validationErrors: {
			_errors: ["Root schema error"],
			username: {
				_errors: ["String must contain at least 3 character(s)"],
			},
		},
		bindArgsValidationErrors: [
			{
				_errors: ["Number must be greater than 0"],
			},
			{},
			{
				id: {
					_errors: ["Invalid uuid"],
				},
			},
		],
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});
