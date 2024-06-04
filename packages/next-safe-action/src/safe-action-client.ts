import type { Infer, Schema } from "@typeschema/main";
import type {} from "zod";
import { actionBuilder } from "./action-builder";
import type { MiddlewareFn, SafeActionClientOpts, ServerCodeFn, StateServerCodeFn } from "./index.types";
import type {
	BindArgsValidationErrors,
	FormatBindArgsValidationErrorsFn,
	FormatValidationErrorsFn,
	ValidationErrors,
} from "./validation-errors.types";

export class SafeActionClient<
	ServerError,
	MetadataSchema extends Schema | undefined = undefined,
	MD = MetadataSchema extends Schema ? Infer<Schema> : undefined,
	Ctx = undefined,
	S extends Schema | undefined = undefined,
	const BAS extends readonly Schema[] = [],
	CVE = ValidationErrors<S>,
	const CBAVE = BindArgsValidationErrors<BAS>,
> {
	readonly #handleServerErrorLog: NonNullable<SafeActionClientOpts<ServerError, any>["handleServerErrorLog"]>;
	readonly #handleReturnedServerError: NonNullable<SafeActionClientOpts<ServerError, any>["handleReturnedServerError"]>;
	readonly #validationStrategy: "typeschema" | "zod";

	#middlewareFns: MiddlewareFn<ServerError, any, any, any>[];
	#ctxType = undefined as Ctx;
	#metadataSchema: MetadataSchema;
	#metadata: MD;
	#schema: S;
	#bindArgsSchemas: BAS;
	#formatValidationErrorsFn: FormatValidationErrorsFn<S, CVE>;
	#formatBindArgsValidationErrorsFn: FormatBindArgsValidationErrorsFn<BAS, CBAVE>;

	constructor(
		opts: {
			middlewareFns: MiddlewareFn<ServerError, any, any, any>[];
			validationStrategy: "typeschema" | "zod";
			metadataSchema: MetadataSchema;
			metadata: MD;
			schema: S;
			bindArgsSchemas: BAS;
			formatValidationErrorsFn: FormatValidationErrorsFn<S, CVE>;
			formatBindArgsValidationErrorsFn: FormatBindArgsValidationErrorsFn<BAS, CBAVE>;
			ctxType: Ctx;
		} & Required<Pick<SafeActionClientOpts<ServerError, any>, "handleReturnedServerError" | "handleServerErrorLog">>
	) {
		this.#middlewareFns = opts.middlewareFns;
		this.#handleServerErrorLog = opts.handleServerErrorLog;
		this.#handleReturnedServerError = opts.handleReturnedServerError;
		this.#validationStrategy = opts.validationStrategy;
		this.#metadataSchema = opts.metadataSchema;
		this.#metadata = opts.metadata;
		this.#schema = (opts.schema ?? undefined) as S;
		this.#bindArgsSchemas = opts.bindArgsSchemas ?? [];
		this.#formatValidationErrorsFn = opts.formatValidationErrorsFn;
		this.#formatBindArgsValidationErrorsFn = opts.formatBindArgsValidationErrorsFn;
	}

	/**
	 * Use a middleware function.
	 * @param middlewareFn Middleware function
	 *
	 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#use See docs for more information}
	 */
	use<NextCtx>(middlewareFn: MiddlewareFn<ServerError, MD, Ctx, NextCtx>) {
		return new SafeActionClient({
			middlewareFns: [...this.#middlewareFns, middlewareFn],
			handleReturnedServerError: this.#handleReturnedServerError,
			handleServerErrorLog: this.#handleServerErrorLog,
			validationStrategy: this.#validationStrategy,
			metadataSchema: this.#metadataSchema,
			metadata: this.#metadata,
			schema: this.#schema,
			bindArgsSchemas: this.#bindArgsSchemas,
			formatValidationErrorsFn: this.#formatValidationErrorsFn,
			formatBindArgsValidationErrorsFn: this.#formatBindArgsValidationErrorsFn,
			ctxType: undefined as NextCtx,
		});
	}

	/**
	 * Define metadata for the action.
	 * @param data Metadata with the same type as the return value of the [`defineMetadataSchema`](https://next-safe-action.dev/docs/safe-action-client/initialization-options#definemetadataschema) optional initialization function
	 *
	 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#metadata See docs for more information}
	 */
	metadata(data: MD) {
		return new SafeActionClient({
			middlewareFns: this.#middlewareFns,
			handleReturnedServerError: this.#handleReturnedServerError,
			handleServerErrorLog: this.#handleServerErrorLog,
			validationStrategy: this.#validationStrategy,
			metadataSchema: this.#metadataSchema,
			metadata: data,
			schema: this.#schema,
			bindArgsSchemas: this.#bindArgsSchemas,
			formatValidationErrorsFn: this.#formatValidationErrorsFn,
			formatBindArgsValidationErrorsFn: this.#formatBindArgsValidationErrorsFn,
			ctxType: undefined as Ctx,
		});
	}

	/**
	 * Define the input validation schema for the action.
	 * @param schema Input validation schema
	 * @param utils Optional utils object
	 *
	 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#schema See docs for more information}
	 */
	schema<OS extends Schema, OCVE = ValidationErrors<OS>>(
		schema: OS,
		utils?: {
			formatValidationErrors?: FormatValidationErrorsFn<OS, OCVE>;
		}
	) {
		return new SafeActionClient({
			middlewareFns: this.#middlewareFns,
			handleReturnedServerError: this.#handleReturnedServerError,
			handleServerErrorLog: this.#handleServerErrorLog,
			validationStrategy: this.#validationStrategy,
			metadataSchema: this.#metadataSchema,
			metadata: this.#metadata,
			schema,
			bindArgsSchemas: this.#bindArgsSchemas,
			formatValidationErrorsFn: (utils?.formatValidationErrors ??
				this.#formatValidationErrorsFn) as FormatValidationErrorsFn<OS, OCVE>,
			formatBindArgsValidationErrorsFn: this.#formatBindArgsValidationErrorsFn,
			ctxType: undefined as Ctx,
		});
	}

	/**
	 * Define the bind args input validation schema for the action.
	 * @param bindArgsSchemas Bind args input validation schemas
	 * @param utils Optional utils object
	 *
	 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#schema See docs for more information}
	 */
	bindArgsSchemas<const OBAS extends readonly Schema[], OCBAVE = BindArgsValidationErrors<OBAS>>(
		bindArgsSchemas: OBAS,
		utils?: { formatBindArgsValidationErrors?: FormatBindArgsValidationErrorsFn<OBAS, OCBAVE> }
	) {
		return new SafeActionClient({
			middlewareFns: this.#middlewareFns,
			handleReturnedServerError: this.#handleReturnedServerError,
			handleServerErrorLog: this.#handleServerErrorLog,
			validationStrategy: this.#validationStrategy,
			metadataSchema: this.#metadataSchema,
			metadata: this.#metadata,
			schema: this.#schema,
			bindArgsSchemas,
			formatValidationErrorsFn: this.#formatValidationErrorsFn,
			formatBindArgsValidationErrorsFn: (utils?.formatBindArgsValidationErrors ??
				this.#formatBindArgsValidationErrorsFn) as FormatBindArgsValidationErrorsFn<OBAS, OCBAVE>,
			ctxType: undefined as Ctx,
		});
	}

	/**
	 * Define the action.
	 * @param serverCodeFn Code that will be executed on the **server side**
	 *
	 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#action--stateaction See docs for more information}
	 */
	action<Data>(serverCodeFn: ServerCodeFn<MD, Ctx, S, BAS, Data>) {
		return actionBuilder({
			validationStrategy: this.#validationStrategy,
			handleReturnedServerError: this.#handleReturnedServerError,
			handleServerErrorLog: this.#handleServerErrorLog,
			middlewareFns: this.#middlewareFns,
			ctxType: this.#ctxType,
			metadataSchema: this.#metadataSchema,
			metadata: this.#metadata,
			schema: this.#schema,
			bindArgsSchemas: this.#bindArgsSchemas,
			formatValidationErrors: this.#formatValidationErrorsFn,
			formatBindArgsValidationErrors: this.#formatBindArgsValidationErrorsFn,
		}).action(serverCodeFn);
	}

	/**
	 * Define the stateful action (without input validation schema, bind arguments validation schemas or metadata).
	 * To be used with the [`useStateAction`](https://next-safe-action.dev/docs/execution/hooks/usestateaction) hook.
	 * @param serverCodeFn Code that will be executed on the **server side**
	 *
	 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#action--stateaction See docs for more information}
	 */
	stateAction<Data>(serverCodeFn: StateServerCodeFn<ServerError, MD, Ctx, S, BAS, CVE, CBAVE, Data>) {
		return actionBuilder({
			validationStrategy: this.#validationStrategy,
			handleReturnedServerError: this.#handleReturnedServerError,
			handleServerErrorLog: this.#handleServerErrorLog,
			middlewareFns: this.#middlewareFns,
			ctxType: this.#ctxType,
			metadataSchema: this.#metadataSchema,
			metadata: this.#metadata,
			schema: this.#schema,
			bindArgsSchemas: this.#bindArgsSchemas,
			formatValidationErrors: this.#formatValidationErrorsFn,
			formatBindArgsValidationErrors: this.#formatBindArgsValidationErrorsFn,
		}).stateAction(serverCodeFn);
	}
}
