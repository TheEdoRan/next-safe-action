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

class SafeActionClient<ServerError, Ctx = undefined, Metadata = undefined> {
	readonly #handleServerErrorLog: NonNullable<SafeActionClientOpts<ServerError, any>["handleServerErrorLog"]>;
	readonly #handleReturnedServerError: NonNullable<SafeActionClientOpts<ServerError, any>["handleReturnedServerError"]>;

	#middlewareFns: MiddlewareFn<ServerError, any, any, any>[];
	#ctxType = undefined as Ctx;

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
	 *
	 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#use See docs for more information}
	 */
	use<NextCtx>(middlewareFn: MiddlewareFn<ServerError, Ctx, NextCtx, Metadata>) {
		return new SafeActionClient<ServerError, NextCtx, Metadata>({
			middlewareFns: [...this.#middlewareFns, middlewareFn],
			handleReturnedServerError: this.#handleReturnedServerError,
			handleServerErrorLog: this.#handleServerErrorLog,
		});
	}

	/**
	 * Define metadata for the action.
	 * @param data Metadata with the same type as the return value of the [`defineMetadataSchema`](https://next-safe-action.dev/docs/safe-action-client/initialization-options#definemetadataschema) optional initialization function
	 *
	 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#metadata See docs for more information}
	 */
	metadata(data: Metadata) {
		return {
			/**
			 * Define the input validation schema for the action.
			 * @param schema Input validation schema
			 * @param utils Optional utils object
			 *
			 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#schema See docs for more information}
			 */
			schema: <S extends Schema | undefined = undefined, const FVE = ValidationErrors<S>>(
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

	/**
	 * Define the input validation schema for the action.
	 * @param schema Input validation schema
	 * @param utils Optional utils object
	 * @returns
	 */
	schema<S extends Schema | undefined = undefined, FVE = ValidationErrors<S>>(
		schema?: S,
		utils?: {
			formatValidationErrors?: FormatValidationErrorsFn<S, FVE>;
		}
	) {
		// schema with no metadata
		return this.#schema<S, FVE, undefined>({
			schema,
			formatValidationErrors: utils?.formatValidationErrors,
			metadata: undefined,
		});
	}

	// internal method that extends `schema` with metadata
	#schema<S extends Schema | undefined = undefined, FVE = ValidationErrors<S>, MD = undefined>(args: {
		schema?: S;
		formatValidationErrors?: FormatValidationErrorsFn<S, FVE>;
		metadata: MD;
	}) {
		return {
			/**
			 * Define the bind arguments input validation schemas for the action.
			 * @param bindArgsSchemas Bind arguments input validation schemas
			 * @param bindArgsUtils Optional utils object
			 *
			 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#bindargsschemas See docs for more information}
			 */
			bindArgsSchemas: <const BAS extends readonly Schema[], FBAVE = BindArgsValidationErrors<BAS>>(
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

	/**
	 * Define the action (without input validation schema, bind arguments validation schemas or metadata).
	 * @param serverCodeFn Code that will be executed on the **server side**
	 *
	 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#action See docs for more information}
	 */
	action<Data>(serverCodeFn: ServerCodeFn<undefined, [], Ctx, undefined, Data>) {
		return actionBuilder({
			handleReturnedServerError: this.#handleReturnedServerError,
			handleServerErrorLog: this.#handleServerErrorLog,
			middlewareFns: this.#middlewareFns,
			metadata: undefined,
			ctxType: this.#ctxType,
		}).action(serverCodeFn);
	}

	/**
	 * Define the stateful action (without input validation schema, bind arguments validation schemas or metadata).
	 * To be used with the [`useStateAction`](https://next-safe-action.dev/docs/usage/usestateaction-hook) hook.
	 * @param serverCodeFn Code that will be executed on the **server side**
	 *
	 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#action See docs for more information}
	 */
	stateAction<Data>(
		serverCodeFn: StateServerCodeFn<ServerError, undefined, [], undefined, undefined, Ctx, undefined, Data>
	) {
		return actionBuilder({
			handleReturnedServerError: this.#handleReturnedServerError,
			handleServerErrorLog: this.#handleServerErrorLog,
			middlewareFns: this.#middlewareFns,
			metadata: undefined,
			ctxType: this.#ctxType,
		}).stateAction(serverCodeFn);
	}

	#bindArgsSchemas<
		S extends Schema | undefined,
		const BAS extends readonly Schema[],
		FVE,
		FBAVE,
		MD = undefined,
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

/**
 * Create a new safe action client.
 * @param createOpts Optional initialization options
 *
 * {@link https://next-safe-action.dev/docs/safe-action-client/initialization-options See docs for more information}
 */
export const createSafeActionClient = <ServerError = string, MetadataSchema extends Schema | undefined = undefined>(
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

	return new SafeActionClient<
		ServerError,
		undefined,
		MetadataSchema extends Schema ? Infer<MetadataSchema> : undefined
	>({
		middlewareFns: [async ({ next }) => next({ ctx: undefined })],
		handleServerErrorLog,
		handleReturnedServerError,
	});
};
