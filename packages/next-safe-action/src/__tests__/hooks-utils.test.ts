import assert from "node:assert";
import { test } from "node:test";
import { getActionShorthandStatusObject, getActionStatus } from "../hooks-utils";
import type { SafeActionResult } from "../index.types";

type TestResult = SafeActionResult<string, undefined, undefined, { ok: boolean }>;

test("getActionStatus returns hasSucceeded after execution completes", () => {
	const result: TestResult = {
		data: {
			ok: true,
		},
	};

	const status = getActionStatus({
		isIdle: false,
		isExecuting: false,
		hasNavigated: false,
		hasThrownError: false,
		result,
	});

	assert.strictEqual(status, "hasSucceeded");
});

test("getActionStatus keeps error precedence over success", () => {
	const status = getActionStatus({
		isIdle: false,
		isExecuting: false,
		hasNavigated: false,
		hasThrownError: true,
		result: {},
	});

	assert.strictEqual(status, "hasErrored");
});

test("shorthand status can be succeeded while still transitioning", () => {
	const shorthand = getActionShorthandStatusObject({
		status: "hasSucceeded",
		isTransitioning: true,
	});

	assert.strictEqual(shorthand.hasSucceeded, true);
	assert.strictEqual(shorthand.isTransitioning, true);
	assert.strictEqual(shorthand.isPending, true);
});

test("executing status remains executing", () => {
	const status = getActionStatus({
		isIdle: false,
		isExecuting: true,
		hasNavigated: false,
		hasThrownError: false,
		result: {},
	});

	assert.strictEqual(status, "executing");
});
