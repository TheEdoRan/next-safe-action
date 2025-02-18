import type { SafeActionFn, SafeActionResult, SafeStateActionFn } from "./index.types";
import type { InferInputOrDefault, StandardSchemaV1 } from "./standard.types";
import type { MaybePromise, Prettify } from "./utils.types";

/**
 * Type of base utils object passed to `useAction`, `useOptimisticAction` and `useStateAction` hooks.
 */
export type HookBaseUtils<S extends StandardSchemaV1 | undefined> = {
	/**
	 * @deprecated Actions should not execute on component mount, since they're used to mutate data.
	 */
	executeOnMount?: (undefined extends S
		? { input?: undefined }
		: {
				input: InferInputOrDefault<S, undefined>;
			}) & { delayMs?: number };
};

/**
 * Type of hooks callbacks. These are executed when action is in a specific state.
 */
export type HookCallbacks<
	ServerError,
	S extends StandardSchemaV1 | undefined,
	BAS extends readonly StandardSchemaV1[],
	CVE,
	CBAVE,
	Data,
> = {
	onExecute?: (args: { input: InferInputOrDefault<S, undefined> }) => MaybePromise<unknown>;
	onSuccess?: (args: { data?: Data; input: InferInputOrDefault<S, undefined> }) => MaybePromise<unknown>;
	onError?: (args: {
		error: Prettify<Omit<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>, "data">>;
		input: InferInputOrDefault<S, undefined>;
	}) => MaybePromise<unknown>;
	onSettled?: (args: {
		result: Prettify<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>;
		input: InferInputOrDefault<S, undefined>;
	}) => MaybePromise<unknown>;
};

/**
 * Type of the safe action function passed to hooks. Same as `SafeActionFn` except it accepts
 * just a single input, without bind arguments.
 */
export type HookSafeActionFn<
	ServerError,
	S extends StandardSchemaV1 | undefined,
	BAS extends readonly StandardSchemaV1[],
	CVE,
	CBAVE,
	Data,
> = (
	input: InferInputOrDefault<S, undefined>
) => Promise<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data> | undefined>;

/**
 * Type of the stateful safe action function passed to hooks. Same as `SafeStateActionFn` except it accepts
 * just a single input, without bind arguments.
 */
export type HookSafeStateActionFn<
	ServerError,
	S extends StandardSchemaV1 | undefined,
	BAS extends readonly StandardSchemaV1[],
	CVE,
	CBAVE,
	Data,
> = (
	prevResult: SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>,
	input: InferInputOrDefault<S, undefined>
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
	S extends StandardSchemaV1 | undefined,
	BAS extends readonly StandardSchemaV1[],
	CVE,
	CBAVE,
	Data,
> = {
	execute: (input: InferInputOrDefault<S, void>) => void;
	executeAsync: (
		input: InferInputOrDefault<S, void>
	) => Promise<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data> | undefined>;
	input: InferInputOrDefault<S, undefined>;
	result: Prettify<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>;
	reset: () => void;
	status: HookActionStatus;
} & HookShorthandStatus;

/**
 * Type of the return object of the `useOptimisticAction` hook.
 */
export type UseOptimisticActionHookReturn<
	ServerError,
	S extends StandardSchemaV1 | undefined,
	BAS extends readonly StandardSchemaV1[],
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
export type UseStateActionHookReturn<
	ServerError,
	S extends StandardSchemaV1 | undefined,
	BAS extends readonly StandardSchemaV1[],
	CVE,
	CBAVE,
	Data,
> = Omit<UseActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data>, "executeAsync" | "reset"> & HookShorthandStatus;

/**
 * Type of the return object of the `useAction` hook.
 */
export type InferUseActionHookReturn<T extends Function> =
	T extends SafeActionFn<
		infer ServerError,
		infer S extends StandardSchemaV1 | undefined,
		infer BAS extends readonly StandardSchemaV1[],
		infer CVE,
		infer CBAVE,
		infer Data
	>
		? UseActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data>
		: never;

/**
 * Type of the return object of the `useOptimisticAction` hook.
 */
export type InferUseOptimisticActionHookReturn<T extends Function, State = any> =
	T extends SafeActionFn<
		infer ServerError,
		infer S extends StandardSchemaV1 | undefined,
		infer BAS extends readonly StandardSchemaV1[],
		infer CVE,
		infer CBAVE,
		infer Data
	>
		? UseOptimisticActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data, State>
		: never;

/**
 * Type of the return object of the `useStateAction` hook.
 */
export type InferUseStateActionHookReturn<T extends Function> =
	T extends SafeStateActionFn<
		infer ServerError,
		infer S extends StandardSchemaV1 | undefined,
		infer BAS extends readonly StandardSchemaV1[],
		infer CVE,
		infer CBAVE,
		infer Data
	>
		? UseStateActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data>
		: never;
