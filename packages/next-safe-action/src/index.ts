import type { Infer, InferIn, Schema } from "@typeschema/main";
import { validate } from "@typeschema/main";
import { isNotFoundError } from "next/dist/client/components/not-found.js";
import { isRedirectError } from "next/dist/client/components/redirect.js";
import type { ErrorList, Extend, MaybePromise, SchemaErrors } from "./utils";
import { buildValidationErrors, isError } from "./utils";

// TYPES

/**
 * Type of options when creating a new safe action client.
 */
export type SafeClientOpts<Context, MiddlewareData> = {
	handleServerErrorLog?: (e: Error) => MaybePromise<void>;
	handleReturnedServerError?: (e: Error) => MaybePromise<string>;
	middleware?: (parsedInput: any, data?: MiddlewareData) => MaybePromise<Context>;
};

/**
 * Type of the function called from Client Components with typesafe input data.
 */
export type SafeAction<S extends Schema, Data> = (input: InferIn<S>) => Promise<{
	data?: Data;
	serverError?: string;
	validationErrors?: ValidationErrors<S>;
}>;

/**
 * Type of the function that executes server code when defining a new safe action.
 */
export type ServerCodeFn<S extends Schema, Data, Context> = (
	parsedInput: Infer<S>,
	ctx: Context
) => Promise<Data>;

/**
 * Type of the returned object when input validation fails.
 */
export type ValidationErrors<S extends Schema> = Extend<ErrorList & SchemaErrors<Infer<S>>>;

// UTILS

export const DEFAULT_SERVER_ERROR = "Something went wrong while executing the operation";

// SAFE ACTION CLIENT

/**
 * Initialize a new action client.
 * @param createOpts Options for creating a new action client.
 * @returns {Function} A function that creates a new action, to be used in server files.
 *
 * {@link https://next-safe-action.dev/docs/getting-started See an example}
 */
export const createSafeActionClient = <Context, MiddlewareData>(
	createOpts?: SafeClientOpts<Context, MiddlewareData>
) => {
	// If server log function is not provided, default to `console.error` for logging
	// server error messages.
	const handleServerErrorLog =
		createOpts?.handleServerErrorLog ||
		((e) => {
			console.error("Action error:", (e as Error).message);
		});

	// If `handleReturnedServerError` is provided, use it to handle server error
	// messages returned on the client.
	// Otherwise mask the error and use a generic message.
	const handleReturnedServerError = (e: Error) =>
		createOpts?.handleReturnedServerError?.(e) || DEFAULT_SERVER_ERROR;

	// `actionBuilder` is the server function that creates a new action.
	// It expects an input schema and a `serverCode` function, so the action
	// knows what to do on the server when called by the client.
	// It returns a function callable by the client.
	const actionBuilder = <const S extends Schema, const Data>(
		schema: S,
		serverCode: ServerCodeFn<S, Data, Context>,
		utils?: {
			middlewareData?: MiddlewareData;
		}
	): SafeAction<S, Data> => {
		// This is the function called by client. If `input` fails the schema
		// parsing, the function will return a `validationErrors` object, containing
		// all the invalid fields provided.
		return async (clientInput) => {
			try {
				const parsedInput = await validate(schema, clientInput);

				// If schema validation fails.
				if (!parsedInput.success) {
					return {
						validationErrors: buildValidationErrors<S>(parsedInput.issues),
					};
				}

				// Get the context if `middleware` is provided.
				const ctx = (await Promise.resolve(
					createOpts?.middleware?.(parsedInput.data, utils?.middlewareData)
				)) as Context;

				// Get `result.data` from the server code function. If it doesn't return
				// anything, `data` will be `null`.
				const data = ((await serverCode(parsedInput.data, ctx)) ?? null) as Data;

				return { data };
			} catch (e: unknown) {
				// next/navigation functions work by throwing an error that will be
				// processed internally by Next.js. So, in this case we need to rethrow it.
				if (isRedirectError(e) || isNotFoundError(e)) {
					throw e;
				}

				// If error is ServerValidationError, return validationErrors as if schema validation would fail.
				if (e instanceof ServerValidationError) {
					return { validationErrors: e.validationErrors as ValidationErrors<S> };
				}

				// If error cannot be handled, warn the user and return a generic message.
				if (!isError(e)) {
					console.warn("Could not handle server error. Not an instance of Error: ", e);
					return { serverError: DEFAULT_SERVER_ERROR };
				}

				await Promise.resolve(handleServerErrorLog(e));

				return {
					serverError: await Promise.resolve(handleReturnedServerError(e)),
				};
			}
		};
	};

	return actionBuilder;
};

// VALIDATION ERRORS

// This class is internally used to throw validation errors in action's server code function, using
// `returnValidationErrors`.
class ServerValidationError<S extends Schema> extends Error {
	public validationErrors: ValidationErrors<S>;
	constructor(validationErrors: ValidationErrors<S>) {
		super("Server Validation Error");
		this.validationErrors = validationErrors;
	}
}

/**
 * Return custom validation errors to the client from the action's server code function.
 * Code declared after this function invocation will not be executed.
 * @param schema Input schema
 * @param validationErrors Validation errors object
 * @throws {ServerValidationError}
 */
export function returnValidationErrors<S extends Schema>(
	schema: S,
	validationErrors: ValidationErrors<S>
): never {
	throw new ServerValidationError<S>(validationErrors);
}
