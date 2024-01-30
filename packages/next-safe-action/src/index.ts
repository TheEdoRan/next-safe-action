import type { Infer, InferIn, Schema } from "@decs/typeschema";
import { wrap } from "@decs/typeschema";
import { isNotFoundError } from "next/dist/client/components/not-found.js";
import { isRedirectError } from "next/dist/client/components/redirect.js";
import type { MaybePromise, ValidationErrors } from "./utils";
import { buildValidationErrors, isError } from "./utils";

// TYPES

/**
 * Type of options when creating a new safe action client.
 */
export type SafeClientOpts<Context> = {
	handleServerErrorLog?: (e: Error) => MaybePromise<void>;
	handleReturnedServerError?: (e: Error) => MaybePromise<string>;
	middleware?: (parsedInput: unknown) => MaybePromise<Context>;
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
export const createSafeActionClient = <Context>(createOpts?: SafeClientOpts<Context>) => {
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
		serverCode: ServerCodeFn<S, Data, Context>
	): SafeAction<S, Data> => {
		// This is the function called by client. If `input` fails the schema
		// parsing, the function will return a `validationError` object, containing
		// all the invalid fields provided.
		return async (clientInput) => {
			try {
				const parsedInput = await wrap(schema).validate(clientInput);

				// If schema validation fails.
				if ("issues" in parsedInput) {
					return {
						validationErrors: buildValidationErrors<S>(parsedInput.issues),
					};
				}

				// Get the context if `middleware` is provided.
				const ctx = (await Promise.resolve(createOpts?.middleware?.(parsedInput.data))) as Context;

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
