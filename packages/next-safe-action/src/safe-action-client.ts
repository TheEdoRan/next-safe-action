import type { Infer, Schema } from "@typeschema/main";
import type {} from "zod";
import { actionBuilder } from "./action-builder";
import type { MiddlewareFn, SafeActionClientOpts, ServerCodeFn, StateServerCodeFn } from "./index.types";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "./utils";
import type {
	BindArgsValidationErrors,
	FormatBindArgsValidationErrorsFn,
	FormatValidationErrorsFn,
	ValidationErrors,
} from "./validation-errors.types";

class SafeActionClient<const ServerError, const Ctx = null, const Metadata = null> {
	readonly #handleServerErrorLog: NonNullable<SafeActionClientOpts<ServerError, any>["handleServerErrorLog"]>;
	readonly #handleReturnedServerError: NonNullable<SafeActionClientOpts<ServerError, any>["handleReturnedServerError"]>;

	#middlewareFns: MiddlewareFn<ServerError, any, any, any>[];
	#ctxType = null as Ctx;

	constructor(
		opts: {
			middlewareFns: MiddlewareFn<ServerError, any, any, any>[];
		} & Required<Pick<SafeActionClientOpts<ServerError, any>, "handleReturnedServerError" | "handleServerErrorLog">>
	) {
		this.#middlewareFns = opts.middlewareFns;
		this.#handleServerErrorLog = opts.handleServerErrorLog;
		this.#handleReturnedServerError = opts.handleReturnedServerError;
	}

	/**
	 * Use a middleware function.
	 * @param middlewareFn Middleware function
	 * @returns SafeActionClient
	 */
	use<const NextCtx>(middlewareFn: MiddlewareFn<ServerError, Ctx, NextCtx, Metadata>) {
		return new SafeActionClient<ServerError, NextCtx, Metadata>({
			middlewareFns: [...this.#middlewareFns, middlewareFn],
			handleReturnedServerError: this.#handleReturnedServerError,
			handleServerErrorLog: this.#handleServerErrorLog,
		});
	}

	metadata(data: Metadata) {
		return {
			schema: <const S extends Schema | undefined = undefined, const FVE = ValidationErrors<S>>(
				schema?: S,
				utils?: {
					formatValidationErrors?: FormatValidationErrorsFn<S, FVE>;
				}
			) =>
				// schema with metadata
				this.#schema<S, FVE, Metadata>({
					schema,
					formatValidationErrors: utils?.formatValidationErrors,
					metadata: data,
				}),
			// or action with metadata and no inputs
			...actionBuilder({
				handleReturnedServerError: this.#handleReturnedServerError,
				handleServerErrorLog: this.#handleServerErrorLog,
				middlewareFns: this.#middlewareFns,
				metadata: data,
				ctxType: this.#ctxType,
			}),
		};
	}

	schema<const S extends Schema | undefined = undefined, const FVE = ValidationErrors<S>>(
		schema?: S,
		utils?: {
			formatValidationErrors?: FormatValidationErrorsFn<S, FVE>;
		}
	) {
		// schema with no metadata
		return this.#schema<S, FVE, null>({
			schema,
			formatValidationErrors: utils?.formatValidationErrors,
			metadata: null,
		});
	}

	// internal method that extends `schema` with metadata
	#schema<const S extends Schema | undefined = undefined, const FVE = ValidationErrors<S>, const MD = null>(args: {
		schema?: S;
		formatValidationErrors?: FormatValidationErrorsFn<S, FVE>;
		metadata: MD;
	}) {
		return {
			bindArgsSchemas: <const BAS extends readonly Schema[], const FBAVE = BindArgsValidationErrors<BAS>>(
				bindArgsSchemas: BAS,
				bindArgsUtils?: {
					formatBindArgsValidationErrors?: FormatBindArgsValidationErrorsFn<BAS, FBAVE>;
				}
			) =>
				this.#bindArgsSchemas<S, BAS, FVE, FBAVE, MD>({
					mainSchema: args.schema,
					bindArgsSchemas,
					formatValidationErrors: args.formatValidationErrors,
					formatBindArgsValidationErrors: bindArgsUtils?.formatBindArgsValidationErrors,
					metadata: args.metadata,
				}),
			...actionBuilder({
				handleReturnedServerError: this.#handleReturnedServerError,
				handleServerErrorLog: this.#handleServerErrorLog,
				middlewareFns: this.#middlewareFns,
				schema: args.schema,
				formatValidationErrors: args.formatValidationErrors,
				metadata: args.metadata,
				ctxType: this.#ctxType,
			}),
		};
	}

	// directly calling the action method without schema, bindArgsSchemas and metadata
	action<const Data>(serverCodeFn: ServerCodeFn<undefined, [], Data, Ctx, null>) {
		return actionBuilder({
			handleReturnedServerError: this.#handleReturnedServerError,
			handleServerErrorLog: this.#handleServerErrorLog,
			middlewareFns: this.#middlewareFns,
			metadata: null,
			ctxType: this.#ctxType,
		}).action(serverCodeFn);
	}
	// directly calling the state action method without schema, bindArgsSchemas and metadata
	stateAction<const Data>(
		serverCodeFn: StateServerCodeFn<ServerError, undefined, [], undefined, undefined, Data, Ctx, null>
	) {
		return actionBuilder({
			handleReturnedServerError: this.#handleReturnedServerError,
			handleServerErrorLog: this.#handleServerErrorLog,
			middlewareFns: this.#middlewareFns,
			metadata: null,
			ctxType: this.#ctxType,
		}).stateAction(serverCodeFn);
	}

	#bindArgsSchemas<
		const S extends Schema | undefined,
		const BAS extends readonly Schema[],
		const FVE,
		const FBAVE,
		const MD = null,
	>(args: {
		mainSchema?: S;
		bindArgsSchemas: BAS;
		formatValidationErrors?: FormatValidationErrorsFn<S, FVE>;
		formatBindArgsValidationErrors?: FormatBindArgsValidationErrorsFn<BAS, FBAVE>;
		metadata: MD;
	}) {
		return actionBuilder({
			handleReturnedServerError: this.#handleReturnedServerError,
			handleServerErrorLog: this.#handleServerErrorLog,
			middlewareFns: this.#middlewareFns,
			schema: args.mainSchema,
			bindArgsSchemas: args.bindArgsSchemas,
			formatValidationErrors: args.formatValidationErrors,
			formatBindArgsValidationErrors: args.formatBindArgsValidationErrors,
			metadata: args.metadata,
			ctxType: this.#ctxType,
		});
	}
}

export const createSafeActionClient = <
	const ServerError = string,
	const MetadataSchema extends Schema | undefined = undefined,
>(
	createOpts?: SafeActionClientOpts<ServerError, MetadataSchema>
) => {
	// If server log function is not provided, default to `console.error` for logging
	// server error messages.
	const handleServerErrorLog =
		createOpts?.handleServerErrorLog ||
		((e) => {
			console.error("Action error:", e.message);
		});

	// If `handleReturnedServerError` is provided, use it to handle server error
	// messages returned on the client.
	// Otherwise mask the error and use a generic message.
	const handleReturnedServerError = ((e: Error) =>
		createOpts?.handleReturnedServerError?.(e) || DEFAULT_SERVER_ERROR_MESSAGE) as NonNullable<
		SafeActionClientOpts<ServerError, MetadataSchema>["handleReturnedServerError"]
	>;

	return new SafeActionClient<ServerError, null, MetadataSchema extends Schema ? Infer<MetadataSchema> : null>({
		middlewareFns: [async ({ next }) => next({ ctx: null })],
		handleServerErrorLog,
		handleReturnedServerError,
	});
};
