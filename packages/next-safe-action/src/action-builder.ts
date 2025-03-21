import { deepmerge } from "deepmerge-ts";
import type {} from "zod";
import type {
	MiddlewareFn,
	MiddlewareResult,
	SafeActionClientOpts,
	SafeActionFn,
	SafeActionResult,
	SafeActionUtils,
	SafeStateActionFn,
	ServerCodeFn,
	StateServerCodeFn,
} from "./index.types";
import { FrameworkErrorHandler } from "./next/errors";
import { standardParse } from "./standard";
import type {
	InferInputArray,
	InferInputOrDefault,
	InferOutputArray,
	InferOutputOrDefault,
	StandardSchemaV1,
} from "./standard.types";
import { DEFAULT_SERVER_ERROR_MESSAGE, isError, winningBoolean } from "./utils";
import {
	ActionBindArgsValidationError,
	ActionMetadataValidationError,
	ActionOutputDataValidationError,
	ActionServerValidationError,
	ActionValidationError,
	buildValidationErrors,
} from "./validation-errors";
import type { HandleValidationErrorsShapeFn, ValidationErrors } from "./validation-errors.types";

export function actionBuilder<
	ServerError,
	MetadataSchema extends StandardSchemaV1 | undefined = undefined,
	MD = InferOutputOrDefault<MetadataSchema, undefined>, // metadata type (inferred from metadata schema)
	Ctx extends object = {},
	ISF extends (() => Promise<StandardSchemaV1>) | undefined = undefined, // input schema function
	IS extends StandardSchemaV1 | undefined = ISF extends Function ? Awaited<ReturnType<ISF>> : undefined, // input schema
	OS extends StandardSchemaV1 | undefined = undefined, // output schema
	const BAS extends readonly StandardSchemaV1[] = [],
	CVE = undefined,
>(args: {
	inputSchemaFn?: ISF;
	bindArgsSchemas?: BAS;
	outputSchema?: OS;
	handleValidationErrorsShape: HandleValidationErrorsShapeFn<IS, BAS, MD, Ctx, CVE>;
	metadataSchema: MetadataSchema;
	metadata: MD;
	handleServerError: NonNullable<SafeActionClientOpts<ServerError, MetadataSchema, any>["handleServerError"]>;
	middlewareFns: MiddlewareFn<ServerError, any, any, any>[];
	ctxType: Ctx;
	throwValidationErrors: boolean;
}) {
	const bindArgsSchemas = (args.bindArgsSchemas ?? []) as BAS;

	function buildAction({ withState }: { withState: false }): {
		action: <Data extends InferOutputOrDefault<OS, any>>(
			serverCodeFn: ServerCodeFn<MD, Ctx, IS, BAS, Data>,
			utils?: SafeActionUtils<ServerError, MD, Ctx, IS, BAS, CVE, Data>
		) => SafeActionFn<ServerError, IS, BAS, CVE, Data>;
	};
	function buildAction({ withState }: { withState: true }): {
		action: <Data extends InferOutputOrDefault<OS, any>>(
			serverCodeFn: StateServerCodeFn<ServerError, MD, Ctx, IS, BAS, CVE, Data>,
			utils?: SafeActionUtils<ServerError, MD, Ctx, IS, BAS, CVE, Data>
		) => SafeStateActionFn<ServerError, IS, BAS, CVE, Data>;
	};
	function buildAction({ withState }: { withState: boolean }) {
		return {
			action: <Data extends InferOutputOrDefault<OS, any>>(
				serverCodeFn:
					| ServerCodeFn<MD, Ctx, IS, BAS, Data>
					| StateServerCodeFn<ServerError, MD, Ctx, IS, BAS, CVE, Data>,
				utils?: SafeActionUtils<ServerError, MD, Ctx, IS, BAS, CVE, Data>
			) => {
				return async (...clientInputs: unknown[]) => {
					let currentCtx: object = {};
					const middlewareResult: MiddlewareResult<ServerError, object> = { success: false };
					type PrevResult = SafeActionResult<ServerError, IS, CVE, Data> | undefined;
					let prevResult: PrevResult | undefined = undefined;
					const parsedInputDatas: any[] = [];
					const frameworkErrorHandler = new FrameworkErrorHandler();

					if (withState) {
						// Previous state is placed between bind args and main arg inputs, so it's always at the index of
						// the bind args schemas + 1. Get it and remove it from the client inputs array.
						prevResult = clientInputs.splice(bindArgsSchemas.length, 1)[0] as PrevResult;
					}

					// If the number of bind args schemas + 1 (which is the optional main arg schema) is greater
					// than the number of provided client inputs, it means that the main argument is missing.
					// This happens when the main schema is missing (since it's optional), or if a void main schema
					// is provided along with bind args schemas.
					if (bindArgsSchemas.length + 1 > clientInputs.length) {
						clientInputs.push(undefined);
					}

					// Execute the middleware stack.
					const executeMiddlewareStack = async (idx = 0) => {
						if (frameworkErrorHandler.error) {
							return;
						}

						const middlewareFn = args.middlewareFns[idx];
						middlewareResult.ctx = currentCtx;

						try {
							if (idx === 0) {
								if (args.metadataSchema) {
									// Validate metadata input.
									const parsedMd = await standardParse(args.metadataSchema, args.metadata);

									if (parsedMd.issues) {
										throw new ActionMetadataValidationError<MetadataSchema>(buildValidationErrors(parsedMd.issues));
									}
								}
							}

							// Middleware function.
							if (middlewareFn) {
								await middlewareFn({
									clientInput: clientInputs.at(-1), // pass raw client input
									bindArgsClientInputs: bindArgsSchemas.length ? clientInputs.slice(0, -1) : [],
									ctx: currentCtx,
									metadata: args.metadata,
									next: async (nextOpts) => {
										currentCtx = deepmerge(currentCtx, nextOpts?.ctx ?? {});
										await executeMiddlewareStack(idx + 1);
										return middlewareResult;
									},
								}).catch((e) => frameworkErrorHandler.handleError(e));
								// Action function.
							} else {
								// Validate the client inputs in parallel.
								const parsedInputs = await Promise.all(
									clientInputs.map(async (input, i) => {
										// Last client input in the array, main argument (no bind arg).
										if (i === clientInputs.length - 1) {
											// If schema is undefined, set parsed data to undefined.
											if (typeof args.inputSchemaFn === "undefined") {
												return {
													value: undefined,
												} as const satisfies StandardSchemaV1.Result<undefined>;
											}

											// Otherwise, parse input with the schema.
											return standardParse(await args.inputSchemaFn(), input);
										}

										// Otherwise, we're processing bind args client inputs.
										return standardParse(bindArgsSchemas[i]!, input);
									})
								);

								let hasBindValidationErrors = false;

								// Initialize the bind args validation errors array with null values.
								// It has the same length as the number of bind arguments (parsedInputs - 1).
								const bindArgsValidationErrors = Array(parsedInputs.length - 1).fill({});

								for (let i = 0; i < parsedInputs.length; i++) {
									const parsedInput = parsedInputs[i]!;

									if (!parsedInput.issues) {
										parsedInputDatas.push(parsedInput.value);
									} else {
										// If we're processing a bind argument and there are validation errors for this one,
										// we need to store them in the bind args validation errors array at this index.
										if (i < parsedInputs.length - 1) {
											bindArgsValidationErrors[i] = buildValidationErrors<BAS[number]>(parsedInput.issues);
											hasBindValidationErrors = true;
										} else {
											// Otherwise, we're processing the non-bind argument (the last one) in the array.
											const validationErrors = buildValidationErrors<IS>(parsedInput.issues);

											middlewareResult.validationErrors = await Promise.resolve(
												args.handleValidationErrorsShape(validationErrors, {
													clientInput: clientInputs.at(-1) as InferInputOrDefault<IS, undefined>,
													bindArgsClientInputs: (bindArgsSchemas.length
														? clientInputs.slice(0, -1)
														: []) as InferInputArray<BAS>,
													ctx: currentCtx as Ctx,
													metadata: args.metadata,
												})
											);
										}
									}
								}

								// If there are bind args validation errors, throw an error.
								if (hasBindValidationErrors) {
									throw new ActionBindArgsValidationError(bindArgsValidationErrors);
								}

								if (middlewareResult.validationErrors) {
									return;
								}

								// @ts-expect-error
								const scfArgs: Parameters<StateServerCodeFn<ServerError, MD, Ctx, IS, BAS, CVE, Data>> = [];

								// Server code function always has this object as the first argument.
								scfArgs[0] = {
									parsedInput: parsedInputDatas.at(-1) as InferOutputOrDefault<IS, undefined>,
									bindArgsParsedInputs: parsedInputDatas.slice(0, -1) as InferOutputArray<BAS>,
									clientInput: clientInputs.at(-1) as InferInputOrDefault<IS, undefined>,
									bindArgsClientInputs: (bindArgsSchemas.length
										? clientInputs.slice(0, -1)
										: []) as InferInputArray<BAS>,
									ctx: currentCtx as Ctx,
									metadata: args.metadata,
								};

								// If this action is stateful, server code function also has a `prevResult` property inside the second
								// argument object.
								if (withState) {
									scfArgs[1] = { prevResult: structuredClone(prevResult!) };
								}

								const data = await serverCodeFn(...scfArgs).catch((e) => frameworkErrorHandler.handleError(e));

								// If a `outputSchema` is passed, validate the action return value.
								if (typeof args.outputSchema !== "undefined" && !frameworkErrorHandler.error) {
									const parsedData = await standardParse(args.outputSchema, data);

									if (parsedData.issues) {
										throw new ActionOutputDataValidationError<OS>(buildValidationErrors(parsedData.issues));
									}
								}

								middlewareResult.success = true;
								middlewareResult.data = data;
								middlewareResult.parsedInput = parsedInputDatas.at(-1);
								middlewareResult.bindArgsParsedInputs = parsedInputDatas.slice(0, -1);
							}
						} catch (e: unknown) {
							// If error is `ActionServerValidationError`, return `validationErrors` as if schema validation would fail.
							if (e instanceof ActionServerValidationError) {
								const ve = e.validationErrors as ValidationErrors<IS>;
								middlewareResult.validationErrors = await Promise.resolve(
									args.handleValidationErrorsShape(ve, {
										clientInput: clientInputs.at(-1) as InferInputOrDefault<IS, undefined>,
										bindArgsClientInputs: (bindArgsSchemas.length
											? clientInputs.slice(0, -1)
											: []) as InferInputArray<BAS>,
										ctx: currentCtx as Ctx,
										metadata: args.metadata,
									})
								);
							} else {
								// If error is not an instance of Error, wrap it in an Error object with
								// the default message.
								const error = isError(e) ? e : new Error(DEFAULT_SERVER_ERROR_MESSAGE);
								const returnedError = await Promise.resolve(
									args.handleServerError(error, {
										clientInput: clientInputs.at(-1), // pass raw client input
										bindArgsClientInputs: bindArgsSchemas.length ? clientInputs.slice(0, -1) : [],
										ctx: currentCtx,
										metadata: args.metadata as InferOutputOrDefault<MetadataSchema, undefined>,
									})
								);

								middlewareResult.serverError = returnedError;
							}
						}
					};

					// Execute middleware chain + action function.
					await executeMiddlewareStack();

					const callbackPromises: (Promise<unknown> | undefined)[] = [];

					// If an internal (navigation) framework error occurred, throw it, so it will be processed by Next.js.
					if (frameworkErrorHandler.error) {
						callbackPromises.push(
							utils?.onNavigation?.({
								metadata: args.metadata,
								ctx: currentCtx as Ctx,
								clientInput: clientInputs.at(-1) as InferInputOrDefault<IS, undefined>,
								bindArgsClientInputs: (bindArgsSchemas.length ? clientInputs.slice(0, -1) : []) as InferInputArray<BAS>,
								navigationKind: FrameworkErrorHandler.getNavigationKind(frameworkErrorHandler.error),
							})
						);

						callbackPromises.push(
							utils?.onSettled?.({
								metadata: args.metadata,
								ctx: currentCtx as Ctx,
								clientInput: clientInputs.at(-1) as InferInputOrDefault<IS, undefined>,
								bindArgsClientInputs: (bindArgsSchemas.length ? clientInputs.slice(0, -1) : []) as InferInputArray<BAS>,
								result: {},
								navigationKind: FrameworkErrorHandler.getNavigationKind(frameworkErrorHandler.error),
							})
						);

						await Promise.all(callbackPromises);

						throw frameworkErrorHandler.error;
					}

					const actionResult: SafeActionResult<ServerError, IS, CVE, Data> = {};

					if (typeof middlewareResult.validationErrors !== "undefined") {
						// `utils.throwValidationErrors` has higher priority since it's set at the action level.
						// It overrides the client setting, if set.
						if (winningBoolean(args.throwValidationErrors, utils?.throwValidationErrors)) {
							throw new ActionValidationError(middlewareResult.validationErrors as CVE);
						} else {
							actionResult.validationErrors = middlewareResult.validationErrors as CVE;
						}
					}

					if (typeof middlewareResult.serverError !== "undefined") {
						if (utils?.throwServerError) {
							throw middlewareResult.serverError;
						} else {
							actionResult.serverError = middlewareResult.serverError;
						}
					}

					if (middlewareResult.success) {
						if (typeof middlewareResult.data !== "undefined") {
							actionResult.data = middlewareResult.data as Data;
						}

						callbackPromises.push(
							utils?.onSuccess?.({
								metadata: args.metadata,
								ctx: currentCtx as Ctx,
								data: actionResult.data as Data,
								clientInput: clientInputs.at(-1) as InferInputOrDefault<IS, undefined>,
								bindArgsClientInputs: (bindArgsSchemas.length ? clientInputs.slice(0, -1) : []) as InferInputArray<BAS>,
								parsedInput: parsedInputDatas.at(-1) as InferOutputOrDefault<IS, undefined>,
								bindArgsParsedInputs: parsedInputDatas.slice(0, -1) as InferOutputArray<BAS>,
							})
						);
					} else {
						callbackPromises.push(
							utils?.onError?.({
								metadata: args.metadata,
								ctx: currentCtx as Ctx,
								clientInput: clientInputs.at(-1) as InferInputOrDefault<IS, undefined>,
								bindArgsClientInputs: (bindArgsSchemas.length ? clientInputs.slice(0, -1) : []) as InferInputArray<BAS>,
								error: actionResult,
							})
						);
					}

					// onSettled, if provided, is always executed.
					callbackPromises.push(
						utils?.onSettled?.({
							metadata: args.metadata,
							ctx: currentCtx as Ctx,
							clientInput: clientInputs.at(-1) as InferInputOrDefault<IS, undefined>,
							bindArgsClientInputs: (bindArgsSchemas.length ? clientInputs.slice(0, -1) : []) as InferInputArray<BAS>,
							result: actionResult,
						})
					);

					await Promise.all(callbackPromises);

					return actionResult;
				};
			},
		};
	}

	return {
		/**
		 * Define the action.
		 * @param serverCodeFn Code that will be executed on the **server side**
		 *
		 * {@link https://next-safe-action.dev/docs/define-actions/instance-methods#action--stateaction See docs for more information}
		 */
		action: buildAction({ withState: false }).action,

		/**
		 * Define the stateful action. To be used with the [`useStateAction`](https://next-safe-action.dev/docs/execute-actions/hooks/usestateaction) hook.
		 * @param serverCodeFn Code that will be executed on the **server side**
		 *
		 * {@link https://next-safe-action.dev/docs/define-actions/instance-methods#action--stateaction See docs for more information}
		 */
		stateAction: buildAction({ withState: true }).action,
	};
}
