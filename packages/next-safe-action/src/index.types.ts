import type { Infer, InferArray, InferIn, InferInArray, Schema, ValidationAdapter } from "./adapters/types";
import type { SafeActionClient } from "./safe-action-client";
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
export type ServerErrorFunctionUtils<MetadataSchema extends Schema | undefined> = {
	clientInput: unknown;
	bindArgsClientInputs: unknown[];
	ctx: object;
	metadata: MetadataSchema extends Schema ? Infer<MetadataSchema> : undefined;
};

/**
 * Type of options when creating a new safe action client.
 */
export type SafeActionClientOpts<
	ServerError,
	MetadataSchema extends Schema | undefined,
	ODVES extends DVES | undefined,
> = {
	validationAdapter?: ValidationAdapter;
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
	S extends Schema | undefined,
	BAS extends readonly Schema[],
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
export type SafeActionFn<ServerError, S extends Schema | undefined, BAS extends readonly Schema[], CVE, CBAVE, Data> = (
	...clientInputs: [...bindArgsInputs: InferInArray<BAS>, input: S extends Schema ? InferIn<S> : void]
) => Promise<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data> | undefined>;

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
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	Data,
> = (args: {
	parsedInput: S extends Schema ? Infer<S> : undefined;
	bindArgsParsedInputs: InferArray<BAS>;
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
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
> = (
	args: {
		parsedInput: S extends Schema ? Infer<S> : undefined;
		bindArgsParsedInputs: InferArray<BAS>;
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
	S extends Schema | undefined,
	BAS extends readonly Schema[],
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
		clientInput: S extends Schema ? InferIn<S> : undefined;
		bindArgsClientInputs: InferInArray<BAS>;
		parsedInput: S extends Schema ? Infer<S> : undefined;
		bindArgsParsedInputs: InferArray<BAS>;
		hasRedirected: boolean;
		hasNotFound: boolean;
	}) => MaybePromise<unknown>;
	onError?: (args: {
		error: Prettify<Omit<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>, "data">>;
		metadata: MD;
		ctx?: Prettify<Ctx>;
		clientInput: S extends Schema ? InferIn<S> : undefined;
		bindArgsClientInputs: InferInArray<BAS>;
	}) => MaybePromise<unknown>;
	onSettled?: (args: {
		result: Prettify<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>;
		metadata: MD;
		ctx?: Prettify<Ctx>;
		clientInput: S extends Schema ? InferIn<S> : undefined;
		bindArgsClientInputs: InferInArray<BAS>;
		hasRedirected: boolean;
		hasNotFound: boolean;
	}) => MaybePromise<unknown>;
};

/**
 * Infer input types of a safe action.
 */
export type InferSafeActionFnInput<T extends Function> = T extends
	| SafeActionFn<any, infer S extends Schema | undefined, infer BAS extends readonly Schema[], any, any, any>
	| SafeStateActionFn<any, infer S extends Schema | undefined, infer BAS extends readonly Schema[], any, any, any>
	? S extends Schema
		? {
				clientInput: InferIn<S>;
				bindArgsClientInputs: InferInArray<BAS>;
				parsedInput: Infer<S>;
				bindArgsParsedInputs: InferArray<BAS>;
			}
		: {
				clientInput: undefined;
				bindArgsClientInputs: InferInArray<BAS>;
				parsedInput: undefined;
				bindArgsParsedInputs: InferArray<BAS>;
			}
	: never;

/**
 * Infer the result type of a safe action.
 */
export type InferSafeActionFnResult<T extends Function> = T extends
	| SafeActionFn<
			infer ServerError,
			infer S extends Schema | undefined,
			infer BAS extends readonly Schema[],
			infer CVE,
			infer CBAVE,
			infer Data
	  >
	| SafeStateActionFn<
			infer ServerError,
			infer S extends Schema | undefined,
			infer BAS extends readonly Schema[],
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
