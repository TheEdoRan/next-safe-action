import type { Infer, InferIn, Schema } from "@typeschema/main";
import type { MaybePromise } from "./utils";
import type { ValidationErrors } from "./validation-errors.types";

/**
 * Type of options when creating a new safe action client.
 */
export type SafeActionClientOpts = {
	handleServerErrorLog?: (e: Error) => MaybePromise<void>;
	handleReturnedServerError?: (e: Error) => MaybePromise<string>;
};

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
export type MiddlewareResult<NextCtx> = SafeActionResult<any, unknown, NextCtx> & {
	parsedInput?: unknown;
	ctx?: unknown;
	success: boolean;
};

/**
 * Type of the middleware function passed to a safe action client.
 */
export type MiddlewareFn<ClientInput, Ctx, NextCtx> = {
	(opts: {
		clientInput: ClientInput;
		ctx: Ctx;
		metadata: ActionMetadata;
		next: {
			<const NC>(opts: { ctx: NC }): Promise<MiddlewareResult<NC>>;
		};
	}): Promise<MiddlewareResult<NextCtx>>;
};

/**
 * Type of the function that executes server code when defining a new safe action.
 */
export type ServerCodeFn<S extends Schema, Data, Context> = (
	parsedInput: Infer<S>,
	utils: { ctx: Context; metadata: ActionMetadata }
) => Promise<Data>;

/**
 * Type of the result of a safe action.
 */
// eslint-disable-next-line
export type SafeActionResult<S extends Schema, Data, NextCtx = unknown> = {
	data?: Data;
	serverError?: string;
	validationErrors?: ValidationErrors<S>;
};

/**
 * Type of the function called from components with typesafe input data.
 */
export type SafeActionFn<S extends Schema, Data> = (
	input: InferIn<S>
) => Promise<SafeActionResult<S, Data>>;
