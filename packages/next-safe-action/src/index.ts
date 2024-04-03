import type { Schema } from "@typeschema/main";
import { validate } from "@typeschema/main";
import { isNotFoundError } from "next/dist/client/components/not-found.js";
import { isRedirectError } from "next/dist/client/components/redirect.js";
import type {
	ActionMetadata,
	MiddlewareFn,
	MiddlewareResult,
	SafeActionClientOpts,
	SafeActionFn,
	SafeActionResult,
	ServerCodeFn,
} from "./index.types";
import { DEFAULT_SERVER_ERROR_MESSAGE, isError } from "./utils";
import {
	ServerValidationError,
	buildValidationErrors,
	returnValidationErrors,
} from "./validation-errors";
import type { ValidationErrors } from "./validation-errors.types";

class SafeActionClient<const Ctx = null> {
	private readonly handleServerErrorLog: NonNullable<SafeActionClientOpts["handleServerErrorLog"]>;
	private readonly handleReturnedServerError: NonNullable<
		SafeActionClientOpts["handleReturnedServerError"]
	>;

	private middlewareFns: MiddlewareFn<any, any, any>[];
	private _metadata: ActionMetadata = {};

	constructor(
		opts: { middlewareFns: MiddlewareFn<any, any, any>[] } & Required<SafeActionClientOpts>
	) {
		this.middlewareFns = opts.middlewareFns;
		this.handleServerErrorLog = opts.handleServerErrorLog;
		this.handleReturnedServerError = opts.handleReturnedServerError;
	}

	/**
	 * Clone the safe action client keeping the same middleware and initialization functions.
	 * This is used to extend the base client with additional middleware functions.
	 * @returns {SafeActionClient}
	 */
	public clone() {
		return new SafeActionClient<Ctx>({
			handleReturnedServerError: this.handleReturnedServerError,
			handleServerErrorLog: this.handleServerErrorLog,
			middlewareFns: [...this.middlewareFns], // copy the middleware stack so we don't mutate it
		});
	}

	/**
	 * Use a middleware function.
	 * @param middlewareFn Middleware function
	 * @returns SafeActionClient
	 */
	public use<const ClientInput, const NextCtx>(
		middlewareFn: MiddlewareFn<ClientInput, Ctx, NextCtx>
	) {
		this.middlewareFns.push(middlewareFn);

		return new SafeActionClient<NextCtx>({
			middlewareFns: this.middlewareFns,
			handleReturnedServerError: this.handleReturnedServerError,
			handleServerErrorLog: this.handleServerErrorLog,
		});
	}

	/**
	 * Set metadata for the action that will be defined afterwards.
	 * @param data Metadata for the action
	 * @returns {Function} Define a new action
	 */
	public metadata(data: ActionMetadata) {
		this._metadata = data;

		return {
			schema: this.schema.bind(this),
		};
	}

	/**
	 * Pass an input schema to define safe action arguments.
	 * @param schema An input schema supported by [TypeSchema](https://typeschema.com/#coverage).
	 * @returns {Function} The `define` function, which is used to define a new safe action.
	 */
	public schema<const S extends Schema>(schema: S) {
		const classThis = this;

		return {
			/**
			 * Define a new safe action.
			 * @param serverCodeFn A function that executes the server code.
			 * @returns {SafeActionFn}
			 */
			define<const Data = null>(serverCodeFn: ServerCodeFn<S, Data, Ctx>): SafeActionFn<S, Data> {
				return async (clientInput: unknown) => {
					let prevCtx: any = null;
					let frameworkError: Error | undefined = undefined;
					const middlewareResult: MiddlewareResult<any> = { success: false };

					// Execute the middleware stack.
					const executeMiddlewareChain = async (idx = 0) => {
						const currentFn = classThis.middlewareFns[idx];

						middlewareResult.ctx = prevCtx;

						try {
							if (currentFn) {
								await currentFn({
									clientInput, // pass raw client input
									ctx: prevCtx,
									metadata: classThis._metadata,
									next: async ({ ctx }) => {
										prevCtx = ctx;
										await executeMiddlewareChain(idx + 1);
										return middlewareResult;
									},
								});
							} else {
								const parsedInput = await validate(schema, clientInput);

								if (!parsedInput.success) {
									middlewareResult.validationErrors = buildValidationErrors<S>(parsedInput.issues);
									return;
								}

								const data =
									(await serverCodeFn(parsedInput.data, {
										ctx: prevCtx,
										metadata: classThis._metadata,
									})) ?? null;
								middlewareResult.success = true;
								middlewareResult.data = data;
								middlewareResult.parsedInput = parsedInput.data;
							}
						} catch (e: unknown) {
							// next/navigation functions work by throwing an error that will be
							// processed internally by Next.js.
							if (isRedirectError(e) || isNotFoundError(e)) {
								middlewareResult.success = true;
								frameworkError = e;
								return;
							}

							// If error is ServerValidationError, return validationErrors as if schema validation would fail.
							if (e instanceof ServerValidationError) {
								middlewareResult.validationErrors = e.validationErrors;
								return;
							}

							if (!isError(e)) {
								console.warn("Could not handle server error. Not an instance of Error: ", e);
								middlewareResult.serverError = DEFAULT_SERVER_ERROR_MESSAGE;
								return;
							}

							await Promise.resolve(classThis.handleServerErrorLog(e));

							middlewareResult.serverError = await Promise.resolve(
								classThis.handleReturnedServerError(e)
							);
						}
					};

					await executeMiddlewareChain();

					// If an internal framework error occurred, throw it, so it will be processed by Next.js.
					if (frameworkError) {
						throw frameworkError;
					}

					const actionResult: SafeActionResult<S, Data> = {};

					if (typeof middlewareResult.data !== "undefined") {
						actionResult.data = middlewareResult.data as Data;
					}

					if (typeof middlewareResult.validationErrors !== "undefined") {
						actionResult.validationErrors =
							middlewareResult.validationErrors as ValidationErrors<S>;
					}

					if (typeof middlewareResult.serverError !== "undefined") {
						actionResult.serverError = middlewareResult.serverError;
					}

					return actionResult;
				};
			},
		};
	}
}

/**
 * Initialize a new action client.
 * @param createOpts Options for creating a new action client.
 * @returns {Function} A function that creates a new action, to be used in server files.
 *
 * {@link https://next-safe-action.dev/docs/getting-started See an example}
 */
export const createSafeActionClient = (createOpts?: SafeActionClientOpts) => {
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
		createOpts?.handleReturnedServerError?.(e) || DEFAULT_SERVER_ERROR_MESSAGE;

	return new SafeActionClient({
		middlewareFns: [async ({ next }) => next({ ctx: null })],
		handleServerErrorLog,
		handleReturnedServerError,
	});
};

export { DEFAULT_SERVER_ERROR_MESSAGE, returnValidationErrors, type ValidationErrors };

export type {
	ActionMetadata,
	MiddlewareFn,
	MiddlewareResult,
	SafeActionClientOpts,
	SafeActionFn,
	SafeActionResult,
	ServerCodeFn,
};
