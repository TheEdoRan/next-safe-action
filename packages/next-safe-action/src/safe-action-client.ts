import { actionBuilder } from "./action-builder";
import type {
	DVES,
	MiddlewareFn,
	SafeActionClientArgs,
	SafeActionUtils,
	ServerCodeFn,
	StateServerCodeFn,
} from "./index.types";
import type { InferOutputOrDefault, StandardSchemaV1 } from "./standard-schema";
import type {
	FlattenedValidationErrors,
	HandleValidationErrorsShapeFn,
	ValidationErrors,
} from "./validation-errors.types";

export class SafeActionClient<
	ServerError,
	ODVES extends DVES | undefined, // override default validation errors shape
	MetadataSchema extends StandardSchemaV1 | undefined = undefined,
	MD = InferOutputOrDefault<MetadataSchema, undefined>, // metadata type (inferred from metadata schema)
	Ctx extends object = {},
	ISF extends (() => Promise<StandardSchemaV1>) | undefined = undefined, // input schema function
	IS extends StandardSchemaV1 | undefined = ISF extends Function ? Awaited<ReturnType<ISF>> : undefined, // input schema
	OS extends StandardSchemaV1 | undefined = undefined, // output schema
	const BAS extends readonly StandardSchemaV1[] = [],
	CVE = undefined,
> {
	readonly #args: SafeActionClientArgs<ServerError, ODVES, MetadataSchema, MD, Ctx, ISF, IS, OS, BAS, CVE>;

	constructor(args: SafeActionClientArgs<ServerError, ODVES, MetadataSchema, MD, Ctx, ISF, IS, OS, BAS, CVE>) {
		this.#args = args;
	}

	/**
	 * Use a middleware function.
	 * @param middlewareFn Middleware function
	 *
	 * {@link https://next-safe-action.dev/docs/define-actions/instance-methods#use See docs for more information}
	 */
	use<NextCtx extends object>(middlewareFn: MiddlewareFn<ServerError, MD, Ctx, Ctx & NextCtx>) {
		return new SafeActionClient({
			...this.#args,
			middlewareFns: [...this.#args.middlewareFns, middlewareFn],
			ctxType: {} as Ctx & NextCtx,
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
			...this.#args,
			metadata: data,
		});
	}

	/**
	 * Define the input validation schema for the action.
	 * @param inputSchema Input validation schema
	 * @param utils Optional utils object
	 *
	 * {@link https://next-safe-action.dev/docs/define-actions/create-the-client#inputschema See docs for more information}
	 */
	inputSchema<
		OIS extends StandardSchemaV1 | ((prevSchema: IS) => Promise<StandardSchemaV1>), // override input schema
		AIS extends StandardSchemaV1 = OIS extends (prevSchema: IS) => Promise<StandardSchemaV1> // actual input schema
			? Awaited<ReturnType<OIS>>
			: OIS,
		// override custom validation errors shape
		OCVE = ODVES extends "flattened" ? FlattenedValidationErrors<ValidationErrors<AIS>> : ValidationErrors<AIS>,
	>(
		inputSchema: OIS,
		utils?: {
			handleValidationErrorsShape?: HandleValidationErrorsShapeFn<AIS, BAS, MD, Ctx, OCVE>;
		}
	) {
		return new SafeActionClient({
			...this.#args,
			// @ts-expect-error
			inputSchemaFn: (inputSchema[Symbol.toStringTag] === "AsyncFunction"
				? async () => {
						const prevSchema = await this.#args.inputSchemaFn?.();
						// @ts-expect-error
						return inputSchema(prevSchema as IS) as AIS;
					}
				: async () => inputSchema) as ISF,
			handleValidationErrorsShape: (utils?.handleValidationErrorsShape ??
				this.#args.handleValidationErrorsShape) as HandleValidationErrorsShapeFn<AIS, BAS, MD, Ctx, OCVE>,
		});
	}

	/**
	 * @deprecated Alias for `inputSchema` method. Use that instead.
	 */
	schema = this.inputSchema;

	/**
	 * Define the bind args input validation schema for the action.
	 * @param bindArgsSchemas Bind args input validation schemas
	 * @param utils Optional utils object
	 *
	 * {@link https://next-safe-action.dev/docs/define-actions/instance-methods#bindargsschemas See docs for more information}
	 */
	bindArgsSchemas<const OBAS extends readonly StandardSchemaV1[]>(bindArgsSchemas: OBAS) {
		return new SafeActionClient({
			...this.#args,
			bindArgsSchemas,
			handleValidationErrorsShape: this.#args.handleValidationErrorsShape as unknown as HandleValidationErrorsShapeFn<
				IS,
				OBAS,
				MD,
				Ctx,
				CVE
			>,
		});
	}

	/**
	 * Define the output data validation schema for the action.
	 * @param schema Output data validation schema
	 *
	 * {@link https://next-safe-action.dev/docs/define-actions/create-the-client#outputschema See docs for more information}
	 */
	outputSchema<OOS extends StandardSchemaV1>(dataSchema: OOS) {
		return new SafeActionClient({
			...this.#args,
			outputSchema: dataSchema,
		});
	}

	/**
	 * Define the action.
	 * @param serverCodeFn Code that will be executed on the **server side**
	 * @param [cb] Optional callbacks that will be called after action execution, on the server.
	 *
	 * {@link https://next-safe-action.dev/docs/define-actions/instance-methods#action--stateaction See docs for more information}
	 */
	action<Data extends InferOutputOrDefault<OS, any>>(
		serverCodeFn: ServerCodeFn<MD, Ctx, IS, BAS, Data>,
		utils?: SafeActionUtils<ServerError, MD, Ctx, IS, BAS, CVE, Data>
	) {
		return actionBuilder(this.#args).action(serverCodeFn, utils);
	}

	/**
	 * Define the stateful action.
	 * To be used with the [`useStateAction`](https://next-safe-action.dev/docs/execute-actions/hooks/usestateaction) hook.
	 * @param serverCodeFn Code that will be executed on the **server side**
	 * @param [cb] Optional callbacks that will be called after action execution, on the server.
	 *
	 * {@link https://next-safe-action.dev/docs/define-actions/instance-methods#action--stateaction See docs for more information}
	 */
	stateAction<Data extends InferOutputOrDefault<OS, any>>(
		serverCodeFn: StateServerCodeFn<ServerError, MD, Ctx, IS, BAS, CVE, Data>,
		utils?: SafeActionUtils<ServerError, MD, Ctx, IS, BAS, CVE, Data>
	) {
		return actionBuilder(this.#args).stateAction(serverCodeFn, utils);
	}
}
