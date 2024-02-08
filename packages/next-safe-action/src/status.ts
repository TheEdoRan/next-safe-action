import type { HookActionStatus } from "./hooks";

/**
 * Returns true if the action is idle.
 * @param status
 * @returns
 */
export function isIdle(status: HookActionStatus): status is "idle" {
	return status === "idle";
}

/**
 * Returns true if the action is executing.
 * @param status
 * @returns
 */
export function isExecuting(status: HookActionStatus): status is "executing" {
	return status === "executing";
}

/**
 * Returns true if the action has succeeded.
 * @param status
 * @returns
 */
export function hasSucceeded(status: HookActionStatus): status is "hasSucceeded" {
	return status === "hasSucceeded";
}

/**
 * Returns true if the action has errored.
 * @param status
 * @returns
 */
export function hasErrored(status: HookActionStatus): status is "hasErrored" {
	return status === "hasErrored";
}
