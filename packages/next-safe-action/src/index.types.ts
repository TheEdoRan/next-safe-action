import type { Infer, InferIn, Schema } from "@typeschema/main";
import type { InferArray, InferInArray, MaybePromise, Prettify } from "./utils";
import type { BindArgsValidationErrors, ValidationErrors } from "./validation-errors.types";

/**
 * Type of options when creating a new safe action client.
 */
export type SafeActionClientOpts<ServerError, MetadataSchema extends Schema | undefined> = {
	handleServerErrorLog?: (e: Error) => MaybePromise<void>;
	handleReturnedServerError?: (e: Error) => MaybePromise<ServerError>;
	defineMetadataSchema?: () => MetadataSchema;
};

/**
 * Type of the result of a safe action.
 */
export type SafeActionResult<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	FVE = ValidationErrors<S>,
	FBAVE = BindArgsValidationErrors<BAS>,
	Data = unknown,
	// eslint-disable-next-line
	NextCtx = unknown,
> = {
	data?: Data extends void ? null : Data; // if function has no return, default to null
	serverError?: ServerError;
	validationErrors?: FVE;
	bindArgsValidationErrors?: FBAVE;
};

/**
 * Type of the function called from components with typesafe input data.
 */
export type SafeActionFn<ServerError, S extends Schema | undefined, BAS extends readonly Schema[], FVE, FBAVE, Data> = (
	...clientInputs: [...bindArgsInputs: InferInArray<BAS>, input: S extends Schema ? InferIn<S> : void]
) => Promise<SafeActionResult<ServerError, S, BAS, FVE, FBAVE, Data>>;

/**
 * Type of the stateful function called from components with typesafe input data.
 */
export type SafeStateActionFn<
	ServerError,
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	FVE,
	FBAVE,
	Data,
> = (
	...clientInputs: [
		...bindArgsInputs: InferInArray<BAS>,
		prevResult: Prettify<SafeActionResult<ServerError, S, BAS, FVE, FBAVE, Data>>,
		input: S extends Schema ? InferIn<S> : void,
	]
) => Promise<SafeActionResult<ServerError, S, BAS, FVE, FBAVE, Data>>;

/**
 * Type of the result of a middleware function. It extends the result of a safe action with
 * information about the action execution.
 */
export type MiddlewareResult<ServerError, NextCtx> = SafeActionResult<
	ServerError,
	any,
	any,
	unknown,
	unknown,
	unknown,
	NextCtx
> & {
	parsedInput?: unknown;
	bindArgsParsedInputs?: unknown[];
	ctx?: unknown;
	success: boolean;
};

/**
 * Type of the middleware function passed to a safe action client.
 */
export type MiddlewareFn<ServerError, Ctx, NextCtx, MD> = {
	(opts: {
		clientInput: unknown;
		bindArgsClientInputs: unknown[];
		ctx: Ctx;
		metadata: MD | null;
		next: {
			<NC>(opts: { ctx: NC }): Promise<MiddlewareResult<ServerError, NC>>;
		};
	}): Promise<MiddlewareResult<ServerError, NextCtx>>;
};

/**
 * Type of the function that executes server code when defining a new safe action.
 */
export type ServerCodeFn<S extends Schema | undefined, BAS extends readonly Schema[], Ctx, MD, Data = null> = (args: {
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
	S extends Schema | undefined,
	BAS extends readonly Schema[],
	FVE,
	FBAVE,
	Ctx,
	MD,
	Data = null,
> = (
	args: {
		parsedInput: S extends Schema ? Infer<S> : undefined;
		bindArgsParsedInputs: InferArray<BAS>;
		ctx: Ctx;
		metadata: MD;
	},
	utils: { prevResult: Prettify<SafeActionResult<ServerError, S, BAS, FVE, FBAVE, Data>> }
) => Promise<Data>;
