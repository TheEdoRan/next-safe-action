import type { InferIn, Schema } from "./adapters/types";
import type { SafeActionResult } from "./index.types";
import type { MaybePromise, Prettify } from "./utils.types";

/**
 * Type of base utils object passed to `useAction`, `useOptimisticAction` and `useStateAction` hooks.
 */
export type HookBaseUtils<S extends Schema | undefined> = {
	executeOnMount?: (undefined extends S
		? { input?: undefined }
		: {
				input: S extends Schema ? InferIn<S> : undefined;
			}) & { delayMs?: number };
};

/**
 * Type of `result` object returned by `useAction`, `useOptimisticAction` and `useStateAction` hooks.
 * If a server-client communication error occurs, `fetchError` will be set to the error message.
 */
export type HookResult<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
> = SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data> & {
	fetchError?: string;
};

/**
 * Type of hooks callbacks. These are executed when action is in a specific state.
 */
export type HookCallbacks<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
> = {
	onExecute?: (args: { input: S extends Schema ? InferIn<S> : undefined }) => MaybePromise<void>;
	onSuccess?: (args: { data?: Data; input: S extends Schema ? InferIn<S> : undefined }) => MaybePromise<void>;
	onError?: (args: {
		error: Prettify<Omit<HookResult<ServerError, S, BAS, CVE, CBAVE, Data>, "data">>;
		input: S extends Schema ? InferIn<S> : undefined;
	}) => MaybePromise<void>;
	onSettled?: (args: {
		result: Prettify<HookResult<ServerError, S, BAS, CVE, CBAVE, Data>>;
		input: S extends Schema ? InferIn<S> : undefined;
	}) => MaybePromise<void>;
};

/**
 * Type of the safe action function passed to hooks. Same as `SafeActionFn` except it accepts
 * just a single input, without bind arguments.
 */
export type HookSafeActionFn<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
> = (
	input: S extends Schema ? InferIn<S> : undefined
) => Promise<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data> | undefined>;

/**
 * Type of the stateful safe action function passed to hooks. Same as `SafeStateActionFn` except it accepts
 * just a single input, without bind arguments.
 */
export type HookSafeStateActionFn<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
> = (
	prevResult: SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>,
	input: S extends Schema ? InferIn<S> : undefined
) => Promise<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>;

/**
 * Type of the action status returned by `useAction`, `useOptimisticAction` and `useStateAction` hooks.
 */
export type HookActionStatus = "idle" | "executing" | "hasSucceeded" | "hasErrored";

/**
 * Type of the shorthand status object returned by `useAction`, `useOptimisticAction` and `useStateAction` hooks.
 */
export type HookShorthandStatus = {
	isIdle: boolean;
	isExecuting: boolean;
	isTransitioning: boolean;
	isPending: boolean;
	hasSucceeded: boolean;
	hasErrored: boolean;
};

/**
 * Type of the return object of the `useAction` hook.
 */
export type UseActionHookReturn<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
> = {
	execute: (input: S extends Schema ? InferIn<S> : void) => void;
	executeAsync: (
		input: S extends Schema ? InferIn<S> : void
	) => Promise<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data> | undefined>;
	input: S extends Schema ? InferIn<S> : undefined;
	result: Prettify<HookResult<ServerError, S, BAS, CVE, CBAVE, Data>>;
	reset: () => void;
	status: HookActionStatus;
} & HookShorthandStatus;

/**
 * Type of the return object of the `useOptimisticAction` hook.
 */
export type UseOptimisticActionHookReturn<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
	State,
> = UseActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data> &
	HookShorthandStatus & {
		optimisticState: State;
	};

/**
 * Type of the return object of the `useStateAction` hook.
 */
export type UseStateActionReturn<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
> = Omit<UseActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data>, "executeAsync" | "reset"> & HookShorthandStatus;
