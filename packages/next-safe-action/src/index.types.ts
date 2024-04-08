import type { Infer, InferIn, Schema } from "@typeschema/main";
import type { InferArray, InferInArray, MaybePromise } from "./utils";
import type { BindArgsValidationErrors, ValidationErrors } from "./validation-errors.types";

/**
 * Type of options when creating a new safe action client.
 */
export type SafeActionClientOpts<ServerError> = {
	handleServerErrorLog?: (e: Error) => MaybePromise<void>;
	handleReturnedServerError?: (e: Error) => MaybePromise<ServerError>;
};

/**
 * Type of the result of a safe action.
 */
export type SafeActionResult<
	ServerError,
	S extends Schema,
	BAS extends Schema[],
	Data,
	// eslint-disable-next-line
	NextCtx = unknown,
> = {
	data?: Data;
	serverError?: ServerError;
	validationErrors?: ValidationErrors<S>;
	bindArgsValidationErrors?: BindArgsValidationErrors<BAS>;
};

/**
 * Type of the function called from components with typesafe input data.
 */
export type SafeActionFn<ServerError, S extends Schema, BAS extends Schema[], Data> = (
	...clientInputs: [...InferInArray<BAS>, InferIn<S>]
) => Promise<SafeActionResult<ServerError, S, BAS, Data>>;

/**
 * Type of meta options to be passed when defining a new safe action.
 */
export type ActionMetadata = {
	actionName?: string;
};

/**
 * Type of the result of a middleware function. It extends the result of a safe action with
 * `parsedInput` and `ctx` optional properties.
 */
export type MiddlewareResult<ServerError, NextCtx> = SafeActionResult<
	ServerError,
	any,
	any,
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
export type MiddlewareFn<ServerError, Ctx, NextCtx> = {
	(opts: {
		clientInput: unknown;
		bindArgsClientInputs: unknown[];
		// bindArgsClientInputs:
		ctx: Ctx;
		metadata: ActionMetadata;
		next: {
			<const NC>(opts: { ctx: NC }): Promise<MiddlewareResult<ServerError, NC>>;
		};
	}): Promise<MiddlewareResult<ServerError, NextCtx>>;
};

/**
 * Type of the function that executes server code when defining a new safe action.
 */
export type ServerCodeFn<S extends Schema, BAS extends Schema[], Data, Context> = (args: {
	parsedInput: Infer<S>;
	bindArgsParsedInputs: InferArray<BAS>;
	ctx: Context;
	metadata: ActionMetadata;
}) => Promise<Data>;
