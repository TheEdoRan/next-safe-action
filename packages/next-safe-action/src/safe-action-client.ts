import type {} from "zod";
import { actionBuilder } from "./action-builder";
import type {
	DVES,
	MiddlewareFn,
	SafeActionCallbacks,
	SafeActionClientOpts,
	ServerCodeFn,
	StateServerCodeFn,
} from "./index.types";
import type { Infer, Schema } from "./validation-adapters";
import type {
	BindArgsValidationErrors,
	FlattenedBindArgsValidationErrors,
	FlattenedValidationErrors,
	HandleBindArgsValidationErrorsShapeFn,
	HandleValidationErrorsShapeFn,
	ValidationErrors,
} from "./validation-errors.types";

export class SafeActionClient<
	ServerError,
	ODVES extends DVES | undefined, // override default validation errors shape
	MetadataSchema extends Schema | undefined = undefined,
	MD = MetadataSchema extends Schema ? Infer<Schema> : undefined,
	Ctx = undefined,
	SF extends (() => Promise<Schema>) | undefined = undefined, // schema function
	S extends Schema | undefined = SF extends Function ? Awaited<ReturnType<SF>> : undefined,
	const BAS extends readonly Schema[] = [],
	CVE = undefined,
	const CBAVE = undefined,
> {
	readonly #handleServerErrorLog: NonNullable<
		SafeActionClientOpts<ServerError, MetadataSchema, ODVES>["handleServerErrorLog"]
	>;
	readonly #handleReturnedServerError: NonNullable<
		SafeActionClientOpts<ServerError, MetadataSchema, ODVES>["handleReturnedServerError"]
	>;
	readonly #middlewareFns: MiddlewareFn<ServerError, any, any, any>[];
	readonly #ctxType = undefined as Ctx;
	readonly #metadataSchema: MetadataSchema;
	readonly #metadata: MD;
	readonly #schemaFn: SF;
	readonly #bindArgsSchemas: BAS;
	readonly #handleValidationErrorsShape: HandleValidationErrorsShapeFn<S, CVE>;
	readonly #handleBindArgsValidationErrorsShape: HandleBindArgsValidationErrorsShapeFn<BAS, CBAVE>;
	readonly #defaultValidationErrorsShape: ODVES;
	readonly #throwValidationErrors: boolean;

	constructor(
		opts: {
			middlewareFns: MiddlewareFn<ServerError, any, any, any>[];
			metadataSchema: MetadataSchema;
			metadata: MD;
			schemaFn: SF;
			bindArgsSchemas: BAS;
			handleValidationErrorsShape: HandleValidationErrorsShapeFn<S, CVE>;
			handleBindArgsValidationErrorsShape: HandleBindArgsValidationErrorsShapeFn<BAS, CBAVE>;
			ctxType: Ctx;
		} & Required<
			Pick<
				SafeActionClientOpts<ServerError, MetadataSchema, ODVES>,
				"handleReturnedServerError" | "handleServerErrorLog" | "defaultValidationErrorsShape" | "throwValidationErrors"
			>
		>
	) {
		this.#middlewareFns = opts.middlewareFns;
		this.#handleServerErrorLog = opts.handleServerErrorLog;
		this.#handleReturnedServerError = opts.handleReturnedServerError;
		this.#metadataSchema = opts.metadataSchema;
		this.#metadata = opts.metadata;
		this.#schemaFn = (opts.schemaFn ?? undefined) as SF;
		this.#bindArgsSchemas = opts.bindArgsSchemas ?? [];
		this.#handleValidationErrorsShape = opts.handleValidationErrorsShape;
		this.#handleBindArgsValidationErrorsShape = opts.handleBindArgsValidationErrorsShape;
		this.#defaultValidationErrorsShape = opts.defaultValidationErrorsShape;
		this.#throwValidationErrors = opts.throwValidationErrors;
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
			metadataSchema: this.#metadataSchema,
			metadata: this.#metadata,
			schemaFn: this.#schemaFn,
			bindArgsSchemas: this.#bindArgsSchemas,
			handleValidationErrorsShape: this.#handleValidationErrorsShape,
			handleBindArgsValidationErrorsShape: this.#handleBindArgsValidationErrorsShape,
			ctxType: undefined as NextCtx,
			defaultValidationErrorsShape: this.#defaultValidationErrorsShape,
			throwValidationErrors: this.#throwValidationErrors,
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
			metadataSchema: this.#metadataSchema,
			metadata: data,
			schemaFn: this.#schemaFn,
			bindArgsSchemas: this.#bindArgsSchemas,
			handleValidationErrorsShape: this.#handleValidationErrorsShape,
			handleBindArgsValidationErrorsShape: this.#handleBindArgsValidationErrorsShape,
			ctxType: undefined as Ctx,
			defaultValidationErrorsShape: this.#defaultValidationErrorsShape,
			throwValidationErrors: this.#throwValidationErrors,
		});
	}

	/**
	 * Define the input validation schema for the action.
	 * @param schema Input validation schema
	 * @param utils Optional utils object
	 *
	 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#schema See docs for more information}
	 */
	schema<
		OS extends Schema | ((prevSchema: S) => Promise<Schema>),
		AS extends Schema = OS extends (prevSchema: S) => Promise<Schema> ? Awaited<ReturnType<OS>> : OS, // actual schema
		OCVE = ODVES extends "flattened" ? FlattenedValidationErrors<ValidationErrors<AS>> : ValidationErrors<AS>,
	>(
		schema: OS,
		utils?: {
			handleValidationErrorsShape?: HandleValidationErrorsShapeFn<AS, OCVE>;
		}
	) {
		return new SafeActionClient({
			middlewareFns: this.#middlewareFns,
			handleReturnedServerError: this.#handleReturnedServerError,
			handleServerErrorLog: this.#handleServerErrorLog,
			metadataSchema: this.#metadataSchema,
			metadata: this.#metadata,
			// @ts-expect-error
			schemaFn: (schema[Symbol.toStringTag] === "AsyncFunction"
				? async () => {
						const prevSchema = await this.#schemaFn?.();
						// @ts-expect-error
						return schema(prevSchema as S) as AS;
					}
				: async () => schema) as SF,
			bindArgsSchemas: this.#bindArgsSchemas,
			handleValidationErrorsShape: (utils?.handleValidationErrorsShape ??
				this.#handleValidationErrorsShape) as HandleValidationErrorsShapeFn<AS, OCVE>,
			handleBindArgsValidationErrorsShape: this.#handleBindArgsValidationErrorsShape,
			ctxType: undefined as Ctx,
			defaultValidationErrorsShape: this.#defaultValidationErrorsShape,
			throwValidationErrors: this.#throwValidationErrors,
		});
	}

	/**
	 * Define the bind args input validation schema for the action.
	 * @param bindArgsSchemas Bind args input validation schemas
	 * @param utils Optional utils object
	 *
	 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#schema See docs for more information}
	 */
	bindArgsSchemas<
		const OBAS extends readonly Schema[],
		OCBAVE = ODVES extends "flattened"
			? FlattenedBindArgsValidationErrors<BindArgsValidationErrors<OBAS>>
			: BindArgsValidationErrors<OBAS>,
	>(
		bindArgsSchemas: OBAS,
		utils?: { handleBindArgsValidationErrorsShape?: HandleBindArgsValidationErrorsShapeFn<OBAS, OCBAVE> }
	) {
		return new SafeActionClient({
			middlewareFns: this.#middlewareFns,
			handleReturnedServerError: this.#handleReturnedServerError,
			handleServerErrorLog: this.#handleServerErrorLog,
			metadataSchema: this.#metadataSchema,
			metadata: this.#metadata,
			schemaFn: this.#schemaFn,
			bindArgsSchemas,
			handleValidationErrorsShape: this.#handleValidationErrorsShape,
			handleBindArgsValidationErrorsShape: (utils?.handleBindArgsValidationErrorsShape ??
				this.#handleBindArgsValidationErrorsShape) as HandleBindArgsValidationErrorsShapeFn<OBAS, OCBAVE>,
			ctxType: undefined as Ctx,
			defaultValidationErrorsShape: this.#defaultValidationErrorsShape,
			throwValidationErrors: this.#throwValidationErrors,
		});
	}

	/**
	 * Define the action.
	 * @param serverCodeFn Code that will be executed on the **server side**
	 * @param [cb] Optional callbacks that will be called after action execution, on the server.
	 *
	 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#action--stateaction See docs for more information}
	 */
	action<Data>(
		serverCodeFn: ServerCodeFn<MD, Ctx, S, BAS, Data>,
		cb?: SafeActionCallbacks<ServerError, MD, Ctx, S, BAS, CVE, CBAVE, Data>
	) {
		return actionBuilder({
			handleReturnedServerError: this.#handleReturnedServerError,
			handleServerErrorLog: this.#handleServerErrorLog,
			middlewareFns: this.#middlewareFns,
			ctxType: this.#ctxType,
			metadataSchema: this.#metadataSchema,
			metadata: this.#metadata,
			schemaFn: this.#schemaFn,
			bindArgsSchemas: this.#bindArgsSchemas,
			handleValidationErrorsShape: this.#handleValidationErrorsShape,
			handleBindArgsValidationErrorsShape: this.#handleBindArgsValidationErrorsShape,
			throwValidationErrors: this.#throwValidationErrors,
		}).action(serverCodeFn, cb);
	}

	/**
	 * Define the stateful action (without input validation schema, bind arguments validation schemas or metadata).
	 * To be used with the [`useStateAction`](https://next-safe-action.dev/docs/execution/hooks/usestateaction) hook.
	 * @param serverCodeFn Code that will be executed on the **server side**
	 * @param [cb] Optional callbacks that will be called after action execution, on the server.
	 *
	 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#action--stateaction See docs for more information}
	 */
	stateAction<Data>(
		serverCodeFn: StateServerCodeFn<ServerError, MD, Ctx, S, BAS, CVE, CBAVE, Data>,
		cb?: SafeActionCallbacks<ServerError, MD, Ctx, S, BAS, CVE, CBAVE, Data>
	) {
		return actionBuilder({
			handleReturnedServerError: this.#handleReturnedServerError,
			handleServerErrorLog: this.#handleServerErrorLog,
			middlewareFns: this.#middlewareFns,
			ctxType: this.#ctxType,
			metadataSchema: this.#metadataSchema,
			metadata: this.#metadata,
			schemaFn: this.#schemaFn,
			bindArgsSchemas: this.#bindArgsSchemas,
			handleValidationErrorsShape: this.#handleValidationErrorsShape,
			handleBindArgsValidationErrorsShape: this.#handleBindArgsValidationErrorsShape,
			throwValidationErrors: this.#throwValidationErrors,
		}).stateAction(serverCodeFn, cb);
	}
}
