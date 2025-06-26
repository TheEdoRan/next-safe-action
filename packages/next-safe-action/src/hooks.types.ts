import type { NavigationKind, SafeActionFn, SafeActionResult, SafeStateActionFn } from "./index.types";
import type { InferInputOrDefault, StandardSchemaV1 } from "./standard-schema";
import type { MaybePromise, Prettify } from "./utils.types";

/**
 * Type of hooks callbacks. These are executed when action is in a specific state.
 */
export type HookCallbacks<ServerError, S extends StandardSchemaV1 | undefined, CVE, Data> = {
	onExecute?: (args: { input: InferInputOrDefault<S, undefined> }) => MaybePromise<unknown>;
	onSuccess?: (args: { data: Data; input: InferInputOrDefault<S, undefined> }) => MaybePromise<unknown>;
	onError?: (args: {
		error: Prettify<Omit<SafeActionResult<ServerError, S, CVE, Data>, "data">> & { thrownError?: Error };
		input: InferInputOrDefault<S, undefined>;
	}) => MaybePromise<unknown>;
	onNavigation?: (args: {
		input: InferInputOrDefault<S, undefined>;
		navigationKind: NavigationKind;
	}) => MaybePromise<unknown>;
	onSettled?: (args: {
		result: Prettify<SafeActionResult<ServerError, S, CVE, Data>>;
		input: InferInputOrDefault<S, undefined>;
		navigationKind?: NavigationKind;
	}) => MaybePromise<unknown>;
};

/**
 * Type of the safe action function passed to hooks. Same as `SafeActionFn` except it accepts
 * just a single input, without bind arguments.
 */
export type HookSafeActionFn<ServerError, S extends StandardSchemaV1 | undefined, CVE, Data> = (
	input: InferInputOrDefault<S, undefined>
) => Promise<SafeActionResult<ServerError, S, CVE, Data>>;

/**
 * Type of the stateful safe action function passed to hooks. Same as `SafeStateActionFn` except it accepts
 * just a single input, without bind arguments.
 */
export type HookSafeStateActionFn<ServerError, S extends StandardSchemaV1 | undefined, CVE, Data> = (
	prevResult: SafeActionResult<ServerError, S, CVE, Data>,
	input: InferInputOrDefault<S, undefined>
) => Promise<SafeActionResult<ServerError, S, CVE, Data>>;

/**
 * Type of the action status returned by `useAction`, `useOptimisticAction` and `useStateAction` hooks.
 */
export type HookActionStatus = "idle" | "executing" | "transitioning" | "hasSucceeded" | "hasErrored" | "hasNavigated";

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
	hasNavigated: boolean;
};

/**
 * Type of the return object of the `useAction` hook.
 */
export type UseActionHookReturn<ServerError, S extends StandardSchemaV1 | undefined, CVE, Data> = {
	execute: (input: InferInputOrDefault<S, void>) => void;
	executeAsync: (input: InferInputOrDefault<S, void>) => Promise<SafeActionResult<ServerError, S, CVE, Data>>;
	input: InferInputOrDefault<S, undefined>;
	result: Prettify<SafeActionResult<ServerError, S, CVE, Data>>;
	reset: () => void;
	status: HookActionStatus;
} & HookShorthandStatus;

/**
 * Type of the return object of the `useOptimisticAction` hook.
 */
export type UseOptimisticActionHookReturn<
	ServerError,
	S extends StandardSchemaV1 | undefined,
	CVE,
	Data,
	State,
> = UseActionHookReturn<ServerError, S, CVE, Data> &
	HookShorthandStatus & {
		optimisticState: State;
	};

/**
 * Type of the return object of the `useStateAction` hook.
 */
export type UseStateActionHookReturn<ServerError, S extends StandardSchemaV1 | undefined, CVE, Data> = Omit<
	UseActionHookReturn<ServerError, S, CVE, Data>,
	"executeAsync" | "reset"
> &
	HookShorthandStatus;

/**
 * Type of the return object of the `useAction` hook.
 */
export type InferUseActionHookReturn<T extends Function> =
	T extends SafeActionFn<infer ServerError, infer S extends StandardSchemaV1 | undefined, any, infer CVE, infer Data>
		? UseActionHookReturn<ServerError, S, CVE, Data>
		: never;

/**
 * Type of the return object of the `useOptimisticAction` hook.
 */
export type InferUseOptimisticActionHookReturn<T extends Function, State = any> =
	T extends SafeActionFn<infer ServerError, infer S extends StandardSchemaV1 | undefined, any, infer CVE, infer Data>
		? UseOptimisticActionHookReturn<ServerError, S, CVE, Data, State>
		: never;

/**
 * Type of the return object of the `useStateAction` hook.
 * @deprecated The `useStateAction` hook is deprecated. Use React's `useActionState` hook instead.
 */
export type InferUseStateActionHookReturn<T extends Function> =
	T extends SafeStateActionFn<
		infer ServerError,
		infer S extends StandardSchemaV1 | undefined,
		any,
		infer CVE,
		infer Data
	>
		? UseStateActionHookReturn<ServerError, S, CVE, Data>
		: never;
