import type { Infer, InferIn, Schema } from "@typeschema/main";
import type { InferArray, InferInArray, MaybePromise, Prettify } from "./utils";
import type { BindArgsValidationErrors, ValidationErrors } from "./validation-errors.types";

/**
 * Type of the default validation errors shape passed to `createSafeActionClient` via `defaultValidationErrorsShape`
 * property.
 */
export type DVES = "formatted" | "flattened";

/**
 * Type of options when creating a new safe action client.
 */
export type SafeActionClientOpts<
	ServerError,
	MetadataSchema extends Schema | undefined,
	ODVES extends DVES | undefined,
> = {
	handleServerErrorLog?: (e: Error) => MaybePromise<void>;
	handleReturnedServerError?: (e: Error) => MaybePromise<ServerError>;
	defineMetadataSchema?: () => MetadataSchema;
	defaultValidationErrorsShape?: ODVES;
};

/**
 * Type of the result of a safe action.
 */
export type SafeActionResult<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	CVE = ValidationErrors<S>,
	CBAVE = BindArgsValidationErrors<BAS>,
	Data = unknown,
	// eslint-disable-next-line
	NextCtx = unknown,
> = {
	data?: Data;
	serverError?: ServerError;
	validationErrors?: CVE;
	bindArgsValidationErrors?: CBAVE;
};

/**
 * Type of the function called from components with type safe input data.
 */
export type SafeActionFn<ServerError, S extends Schema | undefined, BAS extends readonly Schema[], CVE, CBAVE, Data> = (
	...clientInputs: [...bindArgsInputs: InferInArray<BAS>, input: S extends Schema ? InferIn<S> : void]
) => Promise<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>;

/**
 * Type of the stateful function called from components with type safe input data.
 */
export type SafeStateActionFn<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
> = (
	...clientInputs: [
		...bindArgsInputs: InferInArray<BAS>,
		prevResult: Prettify<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>,
		input: S extends Schema ? InferIn<S> : void,
	]
) => Promise<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>;

/**
 * Type of the result of a middleware function. It extends the result of a safe action with
 * information about the action execution.
 */
export type MiddlewareResult<ServerError, NextCtx> = SafeActionResult<ServerError, any, any, any, any, any, NextCtx> & {
	parsedInput?: unknown;
	bindArgsParsedInputs?: unknown[];
	ctx?: unknown;
	success: boolean;
};

/**
 * Type of the middleware function passed to a safe action client.
 */
export type MiddlewareFn<ServerError, MD, Ctx, NextCtx> = {
	(opts: {
		clientInput: unknown;
		bindArgsClientInputs: unknown[];
		ctx: Ctx;
		metadata: MD;
		next: {
			<NC>(opts: { ctx: NC }): Promise<MiddlewareResult<ServerError, NC>>;
		};
	}): Promise<MiddlewareResult<ServerError, NextCtx>>;
};

/**
 * Type of the function that executes server code when defining a new safe action.
 */
export type ServerCodeFn<MD, Ctx, S extends Schema | undefined, BAS extends readonly Schema[], Data> = (args: {
	parsedInput: S extends Schema ? Infer<S> : undefined;
	bindArgsParsedInputs: InferArray<BAS>;
	ctx: Ctx;
	metadata: MD;
}) => Promise<Data>;

/**
 * Type of the function that executes server code when defining a new stateful safe action.
 */
export type StateServerCodeFn<
	ServerError,
	MD,
	Ctx,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
> = (
	args: {
		parsedInput: S extends Schema ? Infer<S> : undefined;
		bindArgsParsedInputs: InferArray<BAS>;
		ctx: Ctx;
		metadata: MD;
	},
	utils: { prevResult: Prettify<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>> }
) => Promise<Data>;

/**
 * Type of action execution callbacks. These are called after the action is executed, on the server side.
 */
export type SafeActionCallbacks<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
> = {
	onSuccess?: (args: {
		data?: Data;
		clientInput: S extends Schema ? InferIn<S> : undefined;
		bindArgsClientInputs: InferInArray<BAS>;
		parsedInput: S extends Schema ? Infer<S> : undefined;
		bindArgsParsedInputs: InferArray<BAS>;
		hasRedirected: boolean;
		hasNotFound: boolean;
	}) => MaybePromise<void>;
	onError?: (args: {
		error: Prettify<Omit<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>, "data">>;
		clientInput: S extends Schema ? InferIn<S> : undefined;
		bindArgsClientInputs: InferInArray<BAS>;
	}) => MaybePromise<void>;
	onSettled?: (args: {
		result: Prettify<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>;
		clientInput: S extends Schema ? InferIn<S> : undefined;
		bindArgsClientInputs: InferInArray<BAS>;
		hasRedirected: boolean;
		hasNotFound: boolean;
	}) => MaybePromise<void>;
};
