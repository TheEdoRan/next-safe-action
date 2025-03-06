/* eslint-disable @typescript-eslint/no-floating-promises */

import assert from "node:assert";
import { test } from "node:test";
import { z } from "zod";
import { createSafeActionClient, flattenBindArgsValidationErrors, formatBindArgsValidationErrors } from "..";

// Default client tests.

const dac = createSafeActionClient();

test("action with invalid bind args input gives back an object with correct `bindArgsValidationErrors` (default formatted shape)", async () => {
	const bindArgsSchemas: [age: z.ZodNumber, userId: z.ZodString, product: z.ZodObject<{ id: z.ZodString }>] = [
		z.number().positive(),
		z.string().uuid(),
		z.object({
			id: z.string().uuid(),
		}),
	];

	const action = dac.bindArgsSchemas(bindArgsSchemas).action(async () => {
		return {
			ok: true,
		};
	});

	const actualResult = await action(-123, crypto.randomUUID(), { id: "invalid_uuid" });

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

test("action with invalid bind args input gives back an object with correct `bindArgsValidationErrors` (default formatted shape overridden by custom flattened shape)", async () => {
	const bindArgsSchemas: [age: z.ZodNumber, userId: z.ZodString, product: z.ZodObject<{ id: z.ZodString }>] = [
		z.number().positive(),
		z.string().uuid(),
		z.object({
			id: z.string().uuid(),
		}),
	];

	const action = dac
		.bindArgsSchemas(bindArgsSchemas, {
			handleBindArgsValidationErrorsShape: async (ve) => flattenBindArgsValidationErrors(ve),
		})
		.action(async () => {
			return {
				ok: true,
			};
		});

	const actualResult = await action(-123, crypto.randomUUID(), { id: "invalid_uuid" });

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

// Formatted shape tests (same as default).

const foac = createSafeActionClient({
	defaultValidationErrorsShape: "formatted",
});

test("action with invalid bind args input gives back an object with correct `bindArgsValidationErrors` (set formatted shape)", async () => {
	const bindArgsSchemas: [age: z.ZodNumber, userId: z.ZodString, product: z.ZodObject<{ id: z.ZodString }>] = [
		z.number().positive(),
		z.string().uuid(),
		z.object({
			id: z.string().uuid(),
		}),
	];

	const action = foac.bindArgsSchemas(bindArgsSchemas).action(async () => {
		return {
			ok: true,
		};
	});

	const actualResult = await action(-123, crypto.randomUUID(), { id: "invalid_uuid" });

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

test("action with invalid bind args input gives back an object with correct `bindArgsValidationErrors` (set formatted shape overridden by custom flattened shape)", async () => {
	const bindArgsSchemas: [age: z.ZodNumber, userId: z.ZodString, product: z.ZodObject<{ id: z.ZodString }>] = [
		z.number().positive(),
		z.string().uuid(),
		z.object({
			id: z.string().uuid(),
		}),
	];

	const action = foac
		.bindArgsSchemas(bindArgsSchemas, {
			handleBindArgsValidationErrorsShape: async (ve) => flattenBindArgsValidationErrors(ve),
		})
		.action(async () => {
			return {
				ok: true,
			};
		});

	const actualResult = await action(-123, crypto.randomUUID(), { id: "invalid_uuid" });

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

test("action with invalid bind args input gives back an object with correct `bindArgsValidationErrors` (set flattened shape)", async () => {
	const bindArgsSchemas: [age: z.ZodNumber, userId: z.ZodString, product: z.ZodObject<{ id: z.ZodString }>] = [
		z.number().positive(),
		z.string().uuid(),
		z.object({
			id: z.string().uuid(),
		}),
	];

	const action = flac.bindArgsSchemas(bindArgsSchemas).action(async () => {
		return {
			ok: true,
		};
	});

	const actualResult = await action(-123, crypto.randomUUID(), { id: "invalid_uuid" });

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

test("action with invalid bind args input gives back an object with correct `bindArgsValidationErrors` (set flattened shape overridden by custom formatted shape)", async () => {
	const bindArgsSchemas: [age: z.ZodNumber, userId: z.ZodString, product: z.ZodObject<{ id: z.ZodString }>] = [
		z.number().positive(),
		z.string().uuid(),
		z.object({
			id: z.string().uuid(),
		}),
	];

	const action = flac
		.bindArgsSchemas(bindArgsSchemas, {
			handleBindArgsValidationErrorsShape: async (ve) => formatBindArgsValidationErrors(ve),
		})
		.action(async () => {
			return {
				ok: true,
			};
		});

	const actualResult = await action(-123, crypto.randomUUID(), { id: "invalid_uuid" });

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
