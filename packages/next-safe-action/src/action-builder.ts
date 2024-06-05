import { validate, type Infer, type Schema } from "@typeschema/main";
import { isNotFoundError } from "next/dist/client/components/not-found.js";
import { isRedirectError } from "next/dist/client/components/redirect.js";
import type {} from "zod";
import type {
	MiddlewareFn,
	MiddlewareResult,
	SafeActionClientOpts,
	SafeActionFn,
	SafeActionResult,
	SafeStateActionFn,
	ServerCodeFn,
	StateServerCodeFn,
} from "./index.types";
import type { InferArray } from "./utils";
import { ActionMetadataError, DEFAULT_SERVER_ERROR_MESSAGE, isError, zodValidate } from "./utils";
import { buildValidationErrors } from "./validation-errors";
import type {
	BindArgsValidationErrors,
	HandleBindArgsValidationErrorsShapeFn,
	HandleValidationErrorsShapeFn,
	ValidationErrors,
} from "./validation-errors.types";

export function actionBuilder<
	ServerError,
	MetadataSchema extends Schema | undefined = undefined,
	MD = MetadataSchema extends Schema ? Infer<Schema> : undefined,
	Ctx = undefined,
	SF extends (() => Promise<Schema>) | undefined = undefined, // schema function
	S extends Schema | undefined = SF extends Function ? Awaited<ReturnType<SF>> : undefined,
	const BAS extends readonly Schema[] = [],
	CVE = undefined,
	CBAVE = undefined,
>(args: {
	schemaFn?: SF;
	bindArgsSchemas?: BAS;
	handleValidationErrorsShape: HandleValidationErrorsShapeFn<S, CVE>;
	handleBindArgsValidationErrorsShape: HandleBindArgsValidationErrorsShapeFn<BAS, CBAVE>;
	metadataSchema: MetadataSchema;
	metadata: MD;
	handleServerErrorLog: NonNullable<SafeActionClientOpts<ServerError, any, any>["handleServerErrorLog"]>;
	handleReturnedServerError: NonNullable<SafeActionClientOpts<ServerError, any, any>["handleReturnedServerError"]>;
	middlewareFns: MiddlewareFn<ServerError, any, any, any>[];
	ctxType: Ctx;
	validationStrategy: "typeschema" | "zod";
}) {
	const bindArgsSchemas = (args.bindArgsSchemas ?? []) as BAS;

	function buildAction({ withState }: { withState: false }): {
		action: <Data>(
			serverCodeFn: ServerCodeFn<MD, Ctx, S, BAS, Data>
		) => SafeActionFn<ServerError, S, BAS, CVE, CBAVE, Data>;
	};
	function buildAction({ withState }: { withState: true }): {
		action: <Data>(
			serverCodeFn: StateServerCodeFn<ServerError, MD, Ctx, S, BAS, CVE, CBAVE, Data>
		) => SafeStateActionFn<ServerError, S, BAS, CVE, CBAVE, Data>;
	};
	function buildAction({ withState }: { withState: boolean }) {
		return {
			action: <Data>(
				serverCodeFn:
					| ServerCodeFn<MD, Ctx, S, BAS, Data>
					| StateServerCodeFn<ServerError, MD, Ctx, S, BAS, CVE, CBAVE, Data>
			) => {
				return async (...clientInputs: unknown[]) => {
					let prevCtx: unknown = undefined;
					const middlewareResult: MiddlewareResult<ServerError, unknown> = { success: false };
					type PrevResult = SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data> | undefined;
					let prevResult: PrevResult | undefined = undefined;
					const valFn = args.validationStrategy === "zod" ? zodValidate : validate;

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
						const middlewareFn = args.middlewareFns[idx];
						middlewareResult.ctx = prevCtx;

						try {
							if (idx === 0) {
								if (args.metadataSchema) {
									// Validate metadata input.
									if (!(await valFn(args.metadataSchema, args.metadata)).success) {
										throw new ActionMetadataError(
											"Invalid metadata input. Please be sure to pass metadata via `metadata` method before defining the action."
										);
									}
								}
							}

							// Middleware function.
							if (middlewareFn) {
								await middlewareFn({
									clientInput: clientInputs.at(-1), // pass raw client input
									bindArgsClientInputs: bindArgsSchemas.length ? clientInputs.slice(0, -1) : [],
									ctx: prevCtx,
									metadata: args.metadata,
									next: async ({ ctx }) => {
										prevCtx = ctx;
										await executeMiddlewareStack(idx + 1);
										return middlewareResult;
									},
								});
								// Action function.
							} else {
								// Validate the client inputs in parallel.
								const parsedInputs = await Promise.all(
									clientInputs.map(async (input, i) => {
										// Last client input in the array, main argument (no bind arg).
										if (i === clientInputs.length - 1) {
											// If schema is undefined, set parsed data to undefined.
											if (typeof args.schemaFn === "undefined") {
												return {
													success: true,
													data: undefined,
												} as const;
											}

											// Otherwise, parse input with the schema.
											return valFn(await args.schemaFn(), input);
										}

										// Otherwise, we're processing bind args client inputs.
										return valFn(bindArgsSchemas[i]!, input);
									})
								);

								let hasBindValidationErrors = false;

								// Initialize the bind args validation errors array with null values.
								// It has the same length as the number of bind arguments (parsedInputs - 1).
								const bindArgsValidationErrors = Array(parsedInputs.length - 1).fill({});
								const parsedInputDatas = [];

								for (let i = 0; i < parsedInputs.length; i++) {
									const parsedInput = parsedInputs[i]!;

									if (parsedInput.success) {
										parsedInputDatas.push(parsedInput.data);
									} else {
										// If we're processing a bind argument and there are validation errors for this one,
										// we need to store them in the bind args validation errors array at this index.
										if (i < parsedInputs.length - 1) {
											bindArgsValidationErrors[i] = buildValidationErrors<BAS[number]>(parsedInput.issues);
											hasBindValidationErrors = true;
										} else {
											// Otherwise, we're processing the non-bind argument (the last one) in the array.
											const validationErrors = buildValidationErrors<S>(parsedInput.issues);

											middlewareResult.validationErrors = await Promise.resolve(
												args.handleValidationErrorsShape(validationErrors)
											);
										}
									}
								}

								// If there are bind args validation errors, format them and store them in the middleware result.
								if (hasBindValidationErrors) {
									middlewareResult.bindArgsValidationErrors = await Promise.resolve(
										args.handleBindArgsValidationErrorsShape(bindArgsValidationErrors as BindArgsValidationErrors<BAS>)
									);
								}

								if (middlewareResult.validationErrors || middlewareResult.bindArgsValidationErrors) {
									return;
								}

								// @ts-expect-error
								const scfArgs: Parameters<StateServerCodeFn<ServerError, MD, Ctx, S, BAS, CVE, CBAVE, Data>> = [];

								// Server code function always has this object as the first argument.
								scfArgs[0] = {
									parsedInput: parsedInputDatas.at(-1) as S extends Schema ? Infer<S> : undefined,
									bindArgsParsedInputs: parsedInputDatas.slice(0, -1) as InferArray<BAS>,
									ctx: prevCtx as Ctx,
									metadata: args.metadata,
								};

								// If this action is stateful, server code function also has a `prevResult` property inside the second
								// argument object.
								if (withState) {
									scfArgs[1] = { prevResult: structuredClone(prevResult!) };
								}

								const data = await serverCodeFn(...scfArgs);

								middlewareResult.success = true;
								middlewareResult.data = data;
								middlewareResult.parsedInput = parsedInputDatas.at(-1);
								middlewareResult.bindArgsParsedInputs = parsedInputDatas.slice(0, -1);
							}
						} catch (e: unknown) {
							// next/navigation functions work by throwing an error that will be
							// processed internally by Next.js.
							if (isRedirectError(e) || isNotFoundError(e)) {
								middlewareResult.success = true;
								// If an internal framework error occurred, throw it, so it will be processed by Next.js.
								throw e;
							}

							// If error is `ActionServerValidationError`, return `validationErrors` as if schema validation would fail.
							// Shouldn't be this difficult to check for `ActionServerValidationError`, but /typeschema clients fail
							// if it's not done this way.
							if (
								e instanceof Error &&
								"kind" in e &&
								"validationErrors" in e &&
								typeof e.kind === "string" &&
								e.kind === "__actionServerValidationError"
							) {
								const ve = e.validationErrors as ValidationErrors<S>;
								middlewareResult.validationErrors = await Promise.resolve(args.handleValidationErrorsShape(ve));
							} else {
								// If error is not an instance of Error, wrap it in an Error object with
								// the default message.
								const error = isError(e) ? e : new Error(DEFAULT_SERVER_ERROR_MESSAGE);
								await Promise.resolve(args.handleServerErrorLog(error));
								middlewareResult.serverError = await Promise.resolve(args.handleReturnedServerError(error));
							}
						}
					};

					// Execute middleware chain + action function.
					await executeMiddlewareStack();

					const actionResult: SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data> = {};

					if (typeof middlewareResult.data !== "undefined") {
						actionResult.data = middlewareResult.data as Data;
					}

					if (typeof middlewareResult.validationErrors !== "undefined") {
						actionResult.validationErrors = middlewareResult.validationErrors as CVE;
					}

					if (typeof middlewareResult.bindArgsValidationErrors !== "undefined") {
						actionResult.bindArgsValidationErrors = middlewareResult.bindArgsValidationErrors as CBAVE;
					}

					if (typeof middlewareResult.serverError !== "undefined") {
						actionResult.serverError = middlewareResult.serverError;
					}

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
		 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#action--stateaction See docs for more information}
		 */
		action: buildAction({ withState: false }).action,

		/**
		 * Define the stateful action. To be used with the [`useStateAction`](https://next-safe-action.dev/docs/execution/hooks/usestateaction) hook.
		 * @param serverCodeFn Code that will be executed on the **server side**
		 *
		 * {@link https://next-safe-action.dev/docs/safe-action-client/instance-methods#action--stateaction See docs for more information}
		 */
		stateAction: buildAction({ withState: true }).action,
	};
}
