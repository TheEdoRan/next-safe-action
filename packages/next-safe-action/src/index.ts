import type { Infer, InferIn, Schema } from "@typeschema/main";
import { validate } from "@typeschema/main";
import { isNotFoundError } from "next/dist/client/components/not-found.js";
import { isRedirectError } from "next/dist/client/components/redirect.js";
import type { MaybePromise } from "./utils";
import { DEFAULT_SERVER_ERROR, isError } from "./utils";
import type { ValidationErrors } from "./validation-errors";
import {
	ServerValidationError,
	buildValidationErrors,
	returnValidationErrors,
} from "./validation-errors";

// TYPES

/**
 * Type of options when creating a new safe action client.
 */
export type SafeActionClientOpts = {
	handleServerErrorLog?: (e: Error) => MaybePromise<void>;
	handleReturnedServerError?: (e: Error) => MaybePromise<string>;
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
 * Type of the middleware function passed to a safe action client.
 */
export type MiddlewareFn<ClientInput, Ctx, NextCtx> = {
	(opts: {
		clientInput: ClientInput;
		ctx: Ctx;
		next: {
			<const NC>(opts: { ctx: NC }): Promise<NC>;
		};
	}): Promise<NextCtx>;
};

/**
 * Type of any middleware function.
 */
export type AnyMiddlewareFn = MiddlewareFn<any, any, any>;

/**
 * Type of the function that executes server code when defining a new safe action.
 */
export type ServerCodeFn<S extends Schema, Data, Context> = (
	parsedInput: Infer<S>,
	ctx: Context
) => Promise<Data>;

// SAFE ACTION CLIENT

class SafeActionClient<const Ctx = null> {
	private readonly handleServerErrorLog: NonNullable<SafeActionClientOpts["handleServerErrorLog"]>;
	private readonly handleReturnedServerError: NonNullable<
		SafeActionClientOpts["handleReturnedServerError"]
	>;

	private middlewareFns: AnyMiddlewareFn[];

	constructor(opts: { middlewareFns: AnyMiddlewareFn[] } & Required<SafeActionClientOpts>) {
		this.middlewareFns = opts.middlewareFns;
		this.handleServerErrorLog = opts.handleServerErrorLog;
		this.handleReturnedServerError = opts.handleReturnedServerError;
	}

	// `use` is used to use a middleware function for this safe action client.
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

	// `define` is used to define a new safe action.
	// It expects an input schema and a `serverCode` function, so the action
	// knows what to do on the server when called by the client.
	// It returns a function callable by the client.
	public define<const S extends Schema, const Data = null>(
		schema: S,
		serverCodeFn: ServerCodeFn<S, Data, Ctx>
	): SafeAction<S, Data> {
		return async (clientInput: unknown) => {
			try {
				let prevCtx: any = undefined;
				let validationErrors: ValidationErrors<S> | undefined = undefined;
				let data: Data | undefined = undefined;

				// Execute the middleware stack.
				const executeMiddlewareChain = async (idx = 0) => {
					const currentFn = this.middlewareFns[idx];

					if (currentFn) {
						await currentFn({
							clientInput, // pass raw client input
							ctx: prevCtx,
							next: async ({ ctx }) => {
								prevCtx = ctx;
								await executeMiddlewareChain(idx + 1);
								return ctx;
							},
						});
					} else {
						const parsedInput = await validate(schema, clientInput);

						if (!parsedInput.success) {
							validationErrors = buildValidationErrors<S>(parsedInput.issues);
							return;
						}

						data = await serverCodeFn(parsedInput.data, prevCtx);
					}
				};

				await executeMiddlewareChain();

				if (validationErrors) {
					return {
						validationErrors,
					};
				}

				return {
					data: (data ?? null) as Data,
				};
			} catch (e: unknown) {
				// next/navigation functions work by throwing an error that will be
				// processed internally by Next.js. So, in this case we need to rethrow it.
				if (isRedirectError(e) || isNotFoundError(e)) {
					throw e;
				}

				// If error is ServerValidationError, return validationErrors as if schema validation would fail.
				if (e instanceof ServerValidationError) {
					return {
						validationErrors: e.validationErrors as ValidationErrors<S>,
					};
				}

				if (!isError(e)) {
					console.warn("Could not handle server error. Not an instance of Error: ", e);

					return { serverError: DEFAULT_SERVER_ERROR };
				}

				await Promise.resolve(this.handleServerErrorLog(e));

				return {
					serverError: await Promise.resolve(this.handleReturnedServerError(e)),
				};
			}
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
		createOpts?.handleReturnedServerError?.(e) || DEFAULT_SERVER_ERROR;

	return new SafeActionClient({
		middlewareFns: [async ({ next }) => next({ ctx: null })],
		handleServerErrorLog,
		handleReturnedServerError,
	});
};

export { DEFAULT_SERVER_ERROR, returnValidationErrors, type ValidationErrors };
