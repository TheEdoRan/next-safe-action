/* eslint-disable @typescript-eslint/no-floating-promises */

import assert from "node:assert";
import { test } from "node:test";
import { z } from "zod";
import { DEFAULT_SERVER_ERROR_MESSAGE, createSafeActionClient, returnValidationErrors } from "../../typeschema";

const ac = createSafeActionClient();

test("typeschema - action with no input schema and no server errors calls `onSuccess` and `onSettled` callbacks", async () => {
	let executed = 0;

	const action = ac.action(
		async () => {
			return;
		},
		{
			onSuccess: () => {
				executed++;
			},
			onError: () => {
				executed++; // should not be called
			},
			onSettled: () => {
				executed++;
			},
		}
	);

	await action();
	assert.strictEqual(executed, 2);
});

test("typeschema - action with input schemas and no errors calls `onSuccess` and `onSettled` callbacks with correct arguments", async () => {
	let executed = 0;
	const inputs = [crypto.randomUUID(), 30, { username: "johndoe" }] as const;

	const action = ac
		.schema(z.object({ username: z.string().min(3) }))
		.bindArgsSchemas([z.string().uuid(), z.number().positive()])
		.action(
			async () => {
				return {
					ok: true,
				};
			},
			{
				onSuccess: ({ clientInput, bindArgsClientInputs, parsedInput, bindArgsParsedInputs, data }) => {
					executed++;

					assert.deepStrictEqual(
						{ clientInput, bindArgsClientInputs, parsedInput, bindArgsParsedInputs, data },
						{
							clientInput: inputs[2],
							bindArgsClientInputs: inputs.slice(0, 2),
							parsedInput: inputs[2],
							bindArgsParsedInputs: inputs.slice(0, 2),
							data: {
								ok: true,
							},
						}
					);
				},
				onError: () => {
					executed++; // should not be called
				},
				onSettled: ({ clientInput, bindArgsClientInputs, result }) => {
					executed++;

					assert.deepStrictEqual(
						{ clientInput, bindArgsClientInputs, result },
						{
							clientInput: inputs[2],
							bindArgsClientInputs: inputs.slice(0, 2),
							result: {
								data: {
									ok: true,
								},
							},
						}
					);
				},
			}
		);

	await action(...inputs);
	assert.strictEqual(executed, 2);
});

test("typeschema - action with input schemas and server error calls `onError` and `onSettled` callbacks with correct arguments", async () => {
	let executed = 0;
	const inputs = [crypto.randomUUID(), 30, { username: "johndoe" }] as const;

	const action = ac
		.schema(z.object({ username: z.string().min(3) }))
		.bindArgsSchemas([z.string().uuid(), z.number().positive()])
		.action(
			async () => {
				throw new Error("Server error");
			},
			{
				onSuccess: () => {
					executed++; // should not be called
				},
				onError({ error, clientInput, bindArgsClientInputs }) {
					executed++;

					assert.deepStrictEqual(
						{ error, clientInput, bindArgsClientInputs },
						{
							error: {
								serverError: DEFAULT_SERVER_ERROR_MESSAGE,
							},
							clientInput: inputs[2],
							bindArgsClientInputs: inputs.slice(0, 2),
						}
					);
				},
				onSettled({ clientInput, bindArgsClientInputs, result }) {
					executed++;

					assert.deepStrictEqual(
						{ result, clientInput, bindArgsClientInputs },
						{
							result: {
								serverError: DEFAULT_SERVER_ERROR_MESSAGE,
							},
							clientInput: inputs[2],
							bindArgsClientInputs: inputs.slice(0, 2),
						}
					);
				},
			}
		);

	await action(...inputs);
	assert.strictEqual(executed, 2);
});

test("typeschema - action with validation errors calls `onError` and `onSettled` callbacks with correct arguments", async () => {
	let executed = 0;
	const inputs = ["invalid_uuid", -30, { username: "j" }] as const;

	const action = ac
		.schema(z.object({ username: z.string().min(3) }))
		.bindArgsSchemas([z.string().uuid(), z.number().positive()])
		.action(
			async () => {
				return {
					ok: true,
				};
			},
			{
				onSuccess: () => {
					executed++; // should not be called
				},
				onError({ error, clientInput, bindArgsClientInputs }) {
					executed++;

					assert.deepStrictEqual(
						{ error, clientInput, bindArgsClientInputs },
						{
							error: {
								validationErrors: {
									username: {
										_errors: ["String must contain at least 3 character(s)"],
									},
								},
								bindArgsValidationErrors: [
									{
										_errors: ["Invalid uuid"],
									},
									{
										_errors: ["Number must be greater than 0"],
									},
								],
							},
							clientInput: inputs[2],
							bindArgsClientInputs: inputs.slice(0, 2),
						}
					);
				},
				onSettled({ clientInput, bindArgsClientInputs, result }) {
					executed++;

					assert.deepStrictEqual(
						{ result, clientInput, bindArgsClientInputs },
						{
							result: {
								validationErrors: {
									username: {
										_errors: ["String must contain at least 3 character(s)"],
									},
								},
								bindArgsValidationErrors: [
									{
										_errors: ["Invalid uuid"],
									},
									{
										_errors: ["Number must be greater than 0"],
									},
								],
							},
							clientInput: inputs[2],
							bindArgsClientInputs: inputs.slice(0, 2),
						}
					);
				},
			}
		);

	await action(...inputs);
	assert.strictEqual(executed, 2);
});

test("typeschema - action with server validation error calls `onError` and `onSettled` callbacks with correct arguments", async () => {
	let executed = 0;

	const schema = z.object({
		username: z.string(),
	});
	const action = ac.schema(z.object({ username: z.string().min(3) })).action(
		async () => {
			returnValidationErrors(schema, {
				username: {
					_errors: ["Invalid username"],
				},
			});
		},
		{
			onSuccess: () => {
				executed++; // should not be called
			},
			onError({ error, clientInput, bindArgsClientInputs }) {
				executed++;

				assert.deepStrictEqual(
					{ error, clientInput, bindArgsClientInputs },
					{
						error: {
							validationErrors: {
								username: {
									_errors: ["Invalid username"],
								},
							},
						},
						clientInput: { username: "johndoe" },
						bindArgsClientInputs: [],
					}
				);
			},
			onSettled({ clientInput, bindArgsClientInputs, result }) {
				executed++;

				assert.deepStrictEqual(
					{ result, clientInput, bindArgsClientInputs },
					{
						result: {
							validationErrors: {
								username: {
									_errors: ["Invalid username"],
								},
							},
						},
						clientInput: { username: "johndoe" },
						bindArgsClientInputs: [],
					}
				);
			},
		}
	);

	await action({ username: "johndoe" });
	assert.strictEqual(executed, 2);
});
