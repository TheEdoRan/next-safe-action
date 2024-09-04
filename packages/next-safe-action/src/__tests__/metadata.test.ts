/* eslint-disable @typescript-eslint/no-floating-promises */

import assert from "node:assert";
import { test } from "node:test";
import { z } from "zod";
import { DEFAULT_SERVER_ERROR_MESSAGE, createSafeActionClient } from "..";
import { zodAdapter } from "../adapters/zod";

const ac = createSafeActionClient({
	validationAdapter: zodAdapter(),
	handleServerError: () => DEFAULT_SERVER_ERROR_MESSAGE, // disable server errors logging for these tests
	defineMetadataSchema() {
		return z.object({
			actionName: z.string(),
		});
	},
});

test("action with expected metadata format works", async () => {
	const md = { actionName: "testAction" };
	const action = ac.metadata(md).action(async ({ metadata }) => {
		return {
			metadata,
		};
	});

	const actualResult = await action();
	const expectedResult = {
		data: {
			metadata: md,
		},
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});

test("action without expected metadata returns server error", async () => {
	const action = ac.action(async ({ metadata }) => {
		return {
			metadata,
		};
	});

	const actualResult = await action();
	const expectedResult = {
		serverError: DEFAULT_SERVER_ERROR_MESSAGE,
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});

test("metadata is passed to middleware functions and server code function", async () => {
	const md = { actionName: "testAction" };

	const action = ac
		.use(async ({ metadata, next }) => {
			return next({ ctx: { md1: metadata } });
		})
		.use(async ({ metadata, next, ctx }) => {
			return next({ ctx: { ...ctx, md2: metadata } });
		})
		.metadata(md)
		.action(async ({ metadata: md3, ctx: { md1, md2 } }) => {
			return {
				md1,
				md2,
				md3,
			};
		});

	const actualResult = await action();

	const expectedResult = {
		data: {
			md1: md,
			md2: md,
			md3: md,
		},
	};

	assert.deepStrictEqual(actualResult, expectedResult);
});
