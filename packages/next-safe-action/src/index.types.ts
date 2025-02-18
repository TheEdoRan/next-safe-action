import type { SafeActionClient } from "./safe-action-client";
import {
	InferInputArray,
	InferInputOrDefault,
	InferOutputArray,
	InferOutputOrDefault,
	StandardSchemaV1,
} from "./standard.types";
import type { MaybePromise, Prettify } from "./utils.types";
import type { BindArgsValidationErrors, ValidationErrors } from "./validation-errors.types";

/**
 * Type of the default validation errors shape passed to `createSafeActionClient` via `defaultValidationErrorsShape`
 * property.
 */
export type DVES = "formatted" | "flattened";

/**
 * Type of the util properties passed to server error handler functions.
 */
export type ServerErrorFunctionUtils<MetadataSchema extends StandardSchemaV1 | undefined> = {
	clientInput: unknown;
	bindArgsClientInputs: unknown[];
	ctx: object;
	metadata: InferOutputOrDefault<MetadataSchema, undefined>;
};

/**
 * Type of options when creating a new safe action client.
 */
export type SafeActionClientOpts<
	ServerError,
	MetadataSchema extends StandardSchemaV1 | undefined,
	ODVES extends DVES | undefined,
> = {
	defineMetadataSchema?: () => MetadataSchema;
	handleServerError?: (error: Error, utils: ServerErrorFunctionUtils<MetadataSchema>) => MaybePromise<ServerError>;
	throwValidationErrors?: boolean;
	defaultValidationErrorsShape?: ODVES;
};

/**
 * Type of the result of a safe action.
 */
export type SafeActionResult<
	ServerError,
	S extends StandardSchemaV1 | undefined,
	BAS extends readonly StandardSchemaV1[],
	CVE = ValidationErrors<S>,
	CBAVE = BindArgsValidationErrors<BAS>,
	Data = unknown,
	// eslint-disable-next-line
	NextCtx = object,
> = {
	data?: Data;
	serverError?: ServerError;
	validationErrors?: CVE;
	bindArgsValidationErrors?: CBAVE;
};

/**
 * Type of the function called from components with type safe input data.
 */
export type SafeActionFn<
	ServerError,
	S extends StandardSchemaV1 | undefined,
	BAS extends readonly StandardSchemaV1[],
	CVE,
	CBAVE,
	Data,
> = (
	...clientInputs: [...bindArgsInputs: InferInputArray<BAS>, input: InferInputOrDefault<S, void>]
) => Promise<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data> | undefined>;

/**
 * Type of the stateful function called from components with type safe input data.
 */
export type SafeStateActionFn<
	ServerError,
	S extends StandardSchemaV1 | undefined,
	BAS extends readonly StandardSchemaV1[],
	CVE,
	CBAVE,
	Data,
> = (
	...clientInputs: [
		...bindArgsInputs: InferInputArray<BAS>,
		prevResult: Prettify<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>,
		input: InferInputOrDefault<S, void>,
	]
) => Promise<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>;

/**
 * Type of the result of a middleware function. It extends the result of a safe action with
 * information about the action execution.
 */
export type MiddlewareResult<ServerError, NextCtx extends object> = SafeActionResult<
	ServerError,
	any,
	any,
	any,
	any,
	any,
	NextCtx
> & {
	parsedInput?: unknown;
	bindArgsParsedInputs?: unknown[];
	ctx?: object;
	success: boolean;
};

/**
 * Type of the middleware function passed to a safe action client.
 */
export type MiddlewareFn<ServerError, MD, Ctx extends object, NextCtx extends object> = {
	(opts: {
		clientInput: unknown;
		bindArgsClientInputs: unknown[];
		ctx: Prettify<Ctx>;
		metadata: MD;
		next: {
			<NC extends object = {}>(opts?: { ctx?: NC }): Promise<MiddlewareResult<ServerError, NC>>;
		};
	}): Promise<MiddlewareResult<ServerError, NextCtx>>;
};

/**
 * Type of the function that executes server code when defining a new safe action.
 */
export type ServerCodeFn<
	MD,
	Ctx extends object,
	S extends StandardSchemaV1 | undefined,
	BAS extends readonly StandardSchemaV1[],
	Data,
> = (args: {
	parsedInput: InferOutputOrDefault<S, undefined>;
	clientInput: InferInputOrDefault<S, undefined>;
	bindArgsParsedInputs: InferOutputArray<BAS>;
	bindArgsClientInputs: InferInputArray<BAS>;
	ctx: Prettify<Ctx>;
	metadata: MD;
}) => Promise<Data>;

/**
 * Type of the function that executes server code when defining a new stateful safe action.
 */
export type StateServerCodeFn<
	ServerError,
	MD,
	Ctx extends object,
	S extends StandardSchemaV1 | undefined,
	BAS extends readonly StandardSchemaV1[],
	CVE,
	CBAVE,
	Data,
> = (
	args: {
		parsedInput: InferOutputOrDefault<S, undefined>;
		clientInput: InferInputOrDefault<S, undefined>;
		bindArgsParsedInputs: InferOutputArray<BAS>;
		bindArgsClientInputs: InferInputArray<BAS>;
		ctx: Prettify<Ctx>;
		metadata: MD;
	},
	utils: { prevResult: Prettify<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>> }
) => Promise<Data>;

/**
 * Type of action execution utils. It includes action callbacks and other utils.
 */
export type SafeActionUtils<
	ServerError,
	MD,
	Ctx extends object,
	S extends StandardSchemaV1 | undefined,
	BAS extends readonly StandardSchemaV1[],
	CVE,
	CBAVE,
	Data,
> = {
	throwServerError?: boolean;
	throwValidationErrors?: boolean;
	onSuccess?: (args: {
		data?: Data;
		metadata: MD;
		ctx?: Prettify<Ctx>;
		clientInput: InferInputOrDefault<S, undefined>;
		bindArgsClientInputs: InferInputArray<BAS>;
		parsedInput: InferOutputOrDefault<S, undefined>;
		bindArgsParsedInputs: InferOutputArray<BAS>;
		hasRedirected: boolean;
		hasNotFound: boolean;
		hasForbidden: boolean;
		hasUnauthorized: boolean;
	}) => Promise<unknown>;
	onError?: (args: {
		error: Prettify<Omit<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>, "data">>;
		metadata: MD;
		ctx?: Prettify<Ctx>;
		clientInput: InferInputOrDefault<S, undefined>;
		bindArgsClientInputs: InferInputArray<BAS>;
	}) => Promise<unknown>;
	onSettled?: (args: {
		result: Prettify<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>;
		metadata: MD;
		ctx?: Prettify<Ctx>;
		clientInput: InferInputOrDefault<S, undefined>;
		bindArgsClientInputs: InferInputArray<BAS>;
		hasRedirected: boolean;
		hasNotFound: boolean;
		hasForbidden: boolean;
		hasUnauthorized: boolean;
	}) => Promise<unknown>;
};

/**
 * Infer input types of a safe action.
 */
export type InferSafeActionFnInput<T extends Function> = T extends
	| SafeActionFn<
			any,
			infer S extends StandardSchemaV1 | undefined,
			infer BAS extends readonly StandardSchemaV1[],
			any,
			any,
			any
	  >
	| SafeStateActionFn<
			any,
			infer S extends StandardSchemaV1 | undefined,
			infer BAS extends readonly StandardSchemaV1[],
			any,
			any,
			any
	  >
	? S extends StandardSchemaV1
		? {
				clientInput: StandardSchemaV1.InferInput<S>;
				bindArgsClientInputs: InferInputArray<BAS>;
				parsedInput: StandardSchemaV1.InferOutput<S>;
				bindArgsParsedInputs: InferOutputArray<BAS>;
			}
		: {
				clientInput: undefined;
				bindArgsClientInputs: InferInputArray<BAS>;
				parsedInput: undefined;
				bindArgsParsedInputs: InferOutputArray<BAS>;
			}
	: never;

/**
 * Infer the result type of a safe action.
 */
export type InferSafeActionFnResult<T extends Function> = T extends
	| SafeActionFn<
			infer ServerError,
			infer S extends StandardSchemaV1 | undefined,
			infer BAS extends readonly StandardSchemaV1[],
			infer CVE,
			infer CBAVE,
			infer Data
	  >
	| SafeStateActionFn<
			infer ServerError,
			infer S extends StandardSchemaV1 | undefined,
			infer BAS extends readonly StandardSchemaV1[],
			infer CVE,
			infer CBAVE,
			infer Data
	  >
	? SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>
	: never;

/**
 * Infer the next context type returned by a middleware function using the `next` function.
 */
export type InferMiddlewareFnNextCtx<T> =
	T extends MiddlewareFn<any, any, any, infer NextCtx extends object> ? NextCtx : never;

/**
 * Infer the context type of a safe action client or middleware function.
 */
export type InferCtx<T> = T extends
	| SafeActionClient<any, any, any, any, infer Ctx extends object, any, any, any, any, any>
	| MiddlewareFn<any, any, infer Ctx extends object, any>
	? Ctx
	: never;

/**
 * Infer the metadata type of a safe action client or middleware function.
 */
export type InferMetadata<T> = T extends
	| SafeActionClient<any, any, any, infer MD, any, any, any, any, any, any>
	| MiddlewareFn<any, infer MD, any, any>
	? MD
	: never;

/**
 * Infer the server error type from a safe action client or a middleware function or a safe action function.
 */
export type InferServerError<T> = T extends
	| SafeActionClient<infer ServerError, any, any, any, any, any, any, any, any, any>
	| MiddlewareFn<infer ServerError, any, any, any>
	| SafeActionFn<infer ServerError, any, any, any, any, any>
	| SafeStateActionFn<infer ServerError, any, any, any, any, any>
	? ServerError
	: never;

/**
 * Type of the core safe action client.
 */
export { SafeActionClient };
