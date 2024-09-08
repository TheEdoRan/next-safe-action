import type {} from "zod";
import { actionBuilder } from "./action-builder";
import type { Infer, Schema, ValidationAdapter } from "./adapters/types";
import type {
	DVES,
	MiddlewareFn,
	SafeActionClientOpts,
	SafeActionUtils,
	ServerCodeFn,
	StateServerCodeFn,
} from "./index.types";
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
	MD = MetadataSchema extends Schema ? Infer<MetadataSchema> : undefined, // metadata type (inferred from metadata schema)
	Ctx extends object = {},
	ISF extends (() => Promise<Schema>) | undefined = undefined, // input schema function
	IS extends Schema | undefined = ISF extends Function ? Awaited<ReturnType<ISF>> : undefined, // input schema
	OS extends Schema | undefined = undefined, // output schema
	const BAS extends readonly Schema[] = [],
	CVE = undefined,
	const CBAVE = undefined,
> {
	readonly #handleServerError: NonNullable<
		SafeActionClientOpts<ServerError, MetadataSchema, ODVES>["handleServerError"]
	>;
	readonly #middlewareFns: MiddlewareFn<ServerError, any, any, any>[];
	readonly #metadataSchema: MetadataSchema;
	readonly #metadata: MD;
	readonly #inputSchemaFn: ISF;
	readonly #outputSchema: OS;
	readonly #ctxType: Ctx;
	readonly #bindArgsSchemas: BAS;
	readonly #validationAdapter: ValidationAdapter;
	readonly #handleValidationErrorsShape: HandleValidationErrorsShapeFn<IS, BAS, MD, Ctx, CVE>;
	readonly #handleBindArgsValidationErrorsShape: HandleBindArgsValidationErrorsShapeFn<IS, BAS, MD, Ctx, CBAVE>;
	readonly #defaultValidationErrorsShape: ODVES;
	readonly #throwValidationErrors: boolean;

	constructor(
		opts: {
			middlewareFns: MiddlewareFn<ServerError, any, any, any>[];
			metadataSchema: MetadataSchema;
			metadata: MD;
			inputSchemaFn: ISF;
			outputSchema: OS;
			bindArgsSchemas: BAS;
			validationAdapter: ValidationAdapter;
			handleValidationErrorsShape: HandleValidationErrorsShapeFn<IS, BAS, MD, Ctx, CVE>;
			handleBindArgsValidationErrorsShape: HandleBindArgsValidationErrorsShapeFn<IS, BAS, MD, Ctx, CBAVE>;
			ctxType: Ctx;
		} & Required<
			Pick<
				SafeActionClientOpts<ServerError, MetadataSchema, ODVES>,
				"handleServerError" | "defaultValidationErrorsShape" | "throwValidationErrors"
			>
		>
	) {
		this.#middlewareFns = opts.middlewareFns;
		this.#handleServerError = opts.handleServerError;
		this.#metadataSchema = opts.metadataSchema;
		this.#metadata = opts.metadata;
		this.#inputSchemaFn = (opts.inputSchemaFn ?? undefined) as ISF;
		this.#outputSchema = opts.outputSchema;
		this.#bindArgsSchemas = opts.bindArgsSchemas ?? [];
		this.#validationAdapter = opts.validationAdapter;
		this.#ctxType = opts.ctxType as unknown as Ctx;
		this.#handleValidationErrorsShape = opts.handleValidationErrorsShape;
		this.#handleBindArgsValidationErrorsShape = opts.handleBindArgsValidationErrorsShape;
		this.#defaultValidationErrorsShape = opts.defaultValidationErrorsShape;
		this.#throwValidationErrors = opts.throwValidationErrors;
	}

	/**
	 * Use a middleware function.
	 * @param middlewareFn Middleware function
	 *
	 * {@link https://next-safe-action.dev/docs/define-actions/instance-methods#use See docs for more information}
	 */
	use<NextCtx extends object>(middlewareFn: MiddlewareFn<ServerError, MD, Ctx, Ctx & NextCtx>) {
		return new SafeActionClient({
			middlewareFns: [...this.#middlewareFns, middlewareFn],
			handleServerError: this.#handleServerError,
			metadataSchema: this.#metadataSchema,
			metadata: this.#metadata,
			inputSchemaFn: this.#inputSchemaFn,
			outputSchema: this.#outputSchema,
			bindArgsSchemas: this.#bindArgsSchemas,
			validationAdapter: this.#validationAdapter,
			handleValidationErrorsShape: this.#handleValidationErrorsShape,
			handleBindArgsValidationErrorsShape: this.#handleBindArgsValidationErrorsShape,
			ctxType: {} as Ctx & NextCtx,
			defaultValidationErrorsShape: this.#defaultValidationErrorsShape,
			throwValidationErrors: this.#throwValidationErrors,
		});
	}

	/**
	 * Define metadata for the action.
	 * @param data Metadata with the same type as the return value of the [`defineMetadataSchema`](https://next-safe-action.dev/docs/define-actions/create-the-client#definemetadataschema) optional initialization function
	 *
	 * {@link https://next-safe-action.dev/docs/define-actions/instance-methods#metadata See docs for more information}
	 */
	metadata(data: MD) {
		return new SafeActionClient({
			middlewareFns: this.#middlewareFns,
			handleServerError: this.#handleServerError,
			metadataSchema: this.#metadataSchema,
			metadata: data,
			inputSchemaFn: this.#inputSchemaFn,
			bindArgsSchemas: this.#bindArgsSchemas,
			outputSchema: this.#outputSchema,
			validationAdapter: this.#validationAdapter,
			handleValidationErrorsShape: this.#handleValidationErrorsShape,
			handleBindArgsValidationErrorsShape: this.#handleBindArgsValidationErrorsShape,
			ctxType: {} as Ctx,
			defaultValidationErrorsShape: this.#defaultValidationErrorsShape,
			throwValidationErrors: this.#throwValidationErrors,
		});
	}

	/**
	 * Define the input validation schema for the action.
	 * @param inputSchema Input validation schema
	 * @param utils Optional utils object
	 *
	 * {@link https://next-safe-action.dev/docs/define-actions/create-the-client#inputschema See docs for more information}
	 */
	schema<
		OIS extends Schema | ((prevSchema: IS) => Promise<Schema>), // override input schema
		AIS extends Schema = OIS extends (prevSchema: IS) => Promise<Schema> ? Awaited<ReturnType<OIS>> : OIS, // actual input schema
		OCVE = ODVES extends "flattened" ? FlattenedValidationErrors<ValidationErrors<AIS>> : ValidationErrors<AIS>,
	>(
		inputSchema: OIS,
		utils?: {
			handleValidationErrorsShape?: HandleValidationErrorsShapeFn<AIS, BAS, MD, Ctx, OCVE>;
		}
	) {
		return new SafeActionClient({
			middlewareFns: this.#middlewareFns,
			handleServerError: this.#handleServerError,
			metadataSchema: this.#metadataSchema,
			metadata: this.#metadata,
			// @ts-expect-error
			inputSchemaFn: (inputSchema[Symbol.toStringTag] === "AsyncFunction"
				? async () => {
						const prevSchema = await this.#inputSchemaFn?.();
						// @ts-expect-error
						return inputSchema(prevSchema as IS) as AIS;
					}
				: async () => inputSchema) as ISF,
			bindArgsSchemas: this.#bindArgsSchemas,
			outputSchema: this.#outputSchema,
			validationAdapter: this.#validationAdapter,
			handleValidationErrorsShape: (utils?.handleValidationErrorsShape ??
				this.#handleValidationErrorsShape) as HandleValidationErrorsShapeFn<AIS, BAS, MD, Ctx, OCVE>,
			handleBindArgsValidationErrorsShape: this
				.#handleBindArgsValidationErrorsShape as HandleBindArgsValidationErrorsShapeFn<AIS, BAS, MD, Ctx, CBAVE>,
			ctxType: {} as Ctx,
			defaultValidationErrorsShape: this.#defaultValidationErrorsShape,
			throwValidationErrors: this.#throwValidationErrors,
		});
	}

	/**
	 * Define the bind args input validation schema for the action.
	 * @param bindArgsSchemas Bind args input validation schemas
	 * @param utils Optional utils object
	 *
	 * {@link https://next-safe-action.dev/docs/define-actions/instance-methods#bindargsschemas See docs for more information}
	 */
	bindArgsSchemas<
		const OBAS extends readonly Schema[],
		OCBAVE = ODVES extends "flattened"
			? FlattenedBindArgsValidationErrors<BindArgsValidationErrors<OBAS>>
			: BindArgsValidationErrors<OBAS>,
	>(
		bindArgsSchemas: OBAS,
		utils?: { handleBindArgsValidationErrorsShape?: HandleBindArgsValidationErrorsShapeFn<IS, OBAS, MD, Ctx, OCBAVE> }
	) {
		return new SafeActionClient({
			middlewareFns: this.#middlewareFns,
			handleServerError: this.#handleServerError,
			metadataSchema: this.#metadataSchema,
			metadata: this.#metadata,
			inputSchemaFn: this.#inputSchemaFn,
			bindArgsSchemas,
			outputSchema: this.#outputSchema,
			validationAdapter: this.#validationAdapter,
			handleValidationErrorsShape: this.#handleValidationErrorsShape as unknown as HandleValidationErrorsShapeFn<
				IS,
				OBAS,
				MD,
				Ctx,
				CVE
			>,
			handleBindArgsValidationErrorsShape: (utils?.handleBindArgsValidationErrorsShape ??
				this.#handleBindArgsValidationErrorsShape) as HandleBindArgsValidationErrorsShapeFn<IS, OBAS, MD, Ctx, OCBAVE>,
			ctxType: {} as Ctx,
			defaultValidationErrorsShape: this.#defaultValidationErrorsShape,
			throwValidationErrors: this.#throwValidationErrors,
		});
	}

	/**
	 * Define the output data validation schema for the action.
	 * @param schema Output data validation schema
	 *
	 * {@link https://next-safe-action.dev/docs/define-actions/create-the-client#outputschema See docs for more information}
	 */
	outputSchema<OOS extends Schema>(dataSchema: OOS) {
		return new SafeActionClient({
			middlewareFns: this.#middlewareFns,
			handleServerError: this.#handleServerError,
			metadataSchema: this.#metadataSchema,
			metadata: this.#metadata,
			inputSchemaFn: this.#inputSchemaFn,
			bindArgsSchemas: this.#bindArgsSchemas,
			outputSchema: dataSchema,
			validationAdapter: this.#validationAdapter,
			handleValidationErrorsShape: this.#handleValidationErrorsShape,
			handleBindArgsValidationErrorsShape: this.#handleBindArgsValidationErrorsShape,
			ctxType: {} as Ctx,
			defaultValidationErrorsShape: this.#defaultValidationErrorsShape,
			throwValidationErrors: this.#throwValidationErrors,
		});
	}

	/**
	 * Define the action.
	 * @param serverCodeFn Code that will be executed on the **server side**
	 * @param [cb] Optional callbacks that will be called after action execution, on the server.
	 *
	 * {@link https://next-safe-action.dev/docs/define-actions/instance-methods#action--stateaction See docs for more information}
	 */
	action<Data extends OS extends Schema ? Infer<OS> : any>(
		serverCodeFn: ServerCodeFn<MD, Ctx, IS, BAS, Data>,
		utils?: SafeActionUtils<ServerError, MD, Ctx, IS, BAS, CVE, CBAVE, Data>
	) {
		return actionBuilder({
			handleServerError: this.#handleServerError,
			middlewareFns: this.#middlewareFns,
			ctxType: this.#ctxType,
			metadataSchema: this.#metadataSchema,
			metadata: this.#metadata,
			inputSchemaFn: this.#inputSchemaFn,
			bindArgsSchemas: this.#bindArgsSchemas,
			outputSchema: this.#outputSchema,
			validationAdapter: this.#validationAdapter,
			handleValidationErrorsShape: this.#handleValidationErrorsShape,
			handleBindArgsValidationErrorsShape: this.#handleBindArgsValidationErrorsShape,
			throwValidationErrors: this.#throwValidationErrors,
		}).action(serverCodeFn, utils);
	}

	/**
	 * Define the stateful action.
	 * To be used with the [`useStateAction`](https://next-safe-action.dev/docs/execute-actions/hooks/usestateaction) hook.
	 * @param serverCodeFn Code that will be executed on the **server side**
	 * @param [cb] Optional callbacks that will be called after action execution, on the server.
	 *
	 * {@link https://next-safe-action.dev/docs/define-actions/instance-methods#action--stateaction See docs for more information}
	 */
	stateAction<Data extends OS extends Schema ? Infer<OS> : any>(
		serverCodeFn: StateServerCodeFn<ServerError, MD, Ctx, IS, BAS, CVE, CBAVE, Data>,
		utils?: SafeActionUtils<ServerError, MD, Ctx, IS, BAS, CVE, CBAVE, Data>
	) {
		return actionBuilder({
			handleServerError: this.#handleServerError,
			middlewareFns: this.#middlewareFns,
			ctxType: this.#ctxType,
			metadataSchema: this.#metadataSchema,
			metadata: this.#metadata,
			inputSchemaFn: this.#inputSchemaFn,
			bindArgsSchemas: this.#bindArgsSchemas,
			outputSchema: this.#outputSchema,
			validationAdapter: this.#validationAdapter,
			handleValidationErrorsShape: this.#handleValidationErrorsShape,
			handleBindArgsValidationErrorsShape: this.#handleBindArgsValidationErrorsShape,
			throwValidationErrors: this.#throwValidationErrors,
		}).stateAction(serverCodeFn, utils);
	}
}
