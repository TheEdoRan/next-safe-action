import type { Infer } from "@typeschema/main";
import { validate, type Schema } from "@typeschema/main";
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
import { DEFAULT_SERVER_ERROR_MESSAGE, isError } from "./utils";
import { ServerValidationError, buildValidationErrors } from "./validation-errors";
import type {
	BindArgsValidationErrors,
	FormatBindArgsValidationErrorsFn,
	FormatValidationErrorsFn,
	ValidationErrors,
} from "./validation-errors.types";

export function actionBuilder<
	ServerError,
	S extends Schema | undefined = undefined,
	const BAS extends readonly Schema[] = [],
	FVE = undefined,
	FBAVE = undefined,
	MD = null,
	Ctx = null,
>(args: {
	schema?: S;
	bindArgsSchemas?: BAS;
	formatValidationErrors?: FormatValidationErrorsFn<S, FVE>;
	formatBindArgsValidationErrors?: FormatBindArgsValidationErrorsFn<BAS, FBAVE>;
	metadata: MD;
	handleServerErrorLog: NonNullable<SafeActionClientOpts<ServerError, any>["handleServerErrorLog"]>;
	handleReturnedServerError: NonNullable<SafeActionClientOpts<ServerError, any>["handleReturnedServerError"]>;
	middlewareFns: MiddlewareFn<ServerError, any, any, MD>[];
	ctxType: Ctx;
}) {
	const bindArgsSchemas = (args.bindArgsSchemas ?? []) as BAS;

	function buildAction({ withState }: { withState: false }): {
		action: <Data = null>(
			serverCodeFn: ServerCodeFn<S, BAS, Ctx, MD, Data>
		) => SafeActionFn<ServerError, S, BAS, FVE, FBAVE, Data>;
	};
	function buildAction({ withState }: { withState: true }): {
		action: <Data = null>(
			serverCodeFn: StateServerCodeFn<ServerError, S, BAS, FVE, FBAVE, Ctx, MD, Data>
		) => SafeStateActionFn<ServerError, S, BAS, FVE, FBAVE, Data>;
	};
	function buildAction({ withState }: { withState: boolean }) {
		return {
			action: <Data = null>(
				serverCodeFn:
					| ServerCodeFn<S, BAS, Ctx, MD, Data>
					| StateServerCodeFn<ServerError, S, BAS, FVE, FBAVE, Ctx, MD, Data>
			) => {
				return async (...clientInputs: unknown[]) => {
					let prevCtx: unknown = null;
					let frameworkError: Error | undefined = undefined;
					const middlewareResult: MiddlewareResult<ServerError, unknown> = { success: false };
					type PrevState = SafeActionResult<ServerError, S, BAS, FVE, FBAVE, Data> | undefined;
					let prevState: PrevState | undefined = undefined;

					if (withState) {
						// Previous state is placed between bind args and main arg inputs, so it's always at the index of
						// the bind args schemas + 1. Get it and remove it from the client inputs array.
						prevState = clientInputs.splice(bindArgsSchemas.length, 1)[0] as PrevState;
					}

					// If the number of bind args schemas + 1 (which is the optional main arg schema) is greater
					// than the number of provided client inputs, it means that the main argument is missing.
					// This happens when the main schema is missing (since it's optional), or if a void main schema
					// is provided along with bind args schemas.
					if (bindArgsSchemas.length + 1 > clientInputs.length) {
						clientInputs.push(undefined);
					}

					// Execute the middleware stack.
					const executeMiddlewareChain = async (idx = 0) => {
						const currentFn = args.middlewareFns[idx];

						middlewareResult.ctx = prevCtx;

						try {
							if (currentFn) {
								await currentFn({
									clientInput: clientInputs.at(-1), // pass raw client input
									bindArgsClientInputs: bindArgsSchemas.length ? clientInputs.slice(0, -1) : [],
									ctx: prevCtx,
									metadata: args.metadata,
									next: async ({ ctx }) => {
										prevCtx = ctx;
										await executeMiddlewareChain(idx + 1);
										return middlewareResult;
									},
								});
							} else {
								// Validate the client inputs in parallel.
								const parsedInputs = await Promise.all(
									clientInputs.map((input, i) => {
										// Last client input in the array, main argument (no bind arg).
										if (i === clientInputs.length - 1) {
											// If schema is undefined, set parsed data to undefined.
											if (typeof args.schema === "undefined") {
												return {
													success: true,
													data: undefined,
												} as const;
											}

											// Otherwise, parse input with the schema.
											return validate(args.schema, input);
										}

										// Otherwise, we're processing bind args client inputs.
										return validate(bindArgsSchemas[i]!, input);
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
												args.formatValidationErrors?.(validationErrors) ?? validationErrors
											);
										}
									}
								}

								// If there are bind args validation errors, format them and store them in the middleware result.
								if (hasBindValidationErrors) {
									middlewareResult.bindArgsValidationErrors = await Promise.resolve(
										args.formatBindArgsValidationErrors?.(bindArgsValidationErrors as BindArgsValidationErrors<BAS>) ??
											bindArgsValidationErrors
									);
								}

								if (middlewareResult.validationErrors || middlewareResult.bindArgsValidationErrors) {
									return;
								}

								// @ts-expect-error
								const scfArgs: Parameters<StateServerCodeFn<ServerError, S, BAS, FVE, FBAVE, Ctx, MD, Data>> = [];

								scfArgs[0] = {
									parsedInput: parsedInputDatas.at(-1) as S extends Schema ? Infer<S> : undefined,
									bindArgsParsedInputs: parsedInputDatas.slice(0, -1) as InferArray<BAS>,
									ctx: prevCtx as Ctx,
									metadata: args.metadata,
								};

								if (withState) {
									scfArgs[1] = { prevState: structuredClone(prevState!) };
								}

								const data = (await serverCodeFn(...scfArgs)) ?? null;

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
								frameworkError = e;
								return;
							}

							// If error is ServerValidationError, return validationErrors as if schema validation would fail.
							if (e instanceof ServerValidationError) {
								const ve = e.validationErrors as ValidationErrors<S>;

								middlewareResult.validationErrors = await Promise.resolve(args.formatValidationErrors?.(ve) ?? ve);

								return;
							}

							// If error is not an instance of Error, wrap it in an Error object with
							// the default message.
							const error = isError(e) ? e : new Error(DEFAULT_SERVER_ERROR_MESSAGE);

							await Promise.resolve(args.handleServerErrorLog(error));

							middlewareResult.serverError = await Promise.resolve(args.handleReturnedServerError(error));
						}
					};

					await executeMiddlewareChain();

					// If an internal framework error occurred, throw it, so it will be processed by Next.js.
					if (frameworkError) {
						throw frameworkError;
					}

					const actionResult: SafeActionResult<ServerError, S, BAS, FVE, FBAVE, Data> = {};

					if (typeof middlewareResult.data !== "undefined") {
						actionResult.data = middlewareResult.data as Data extends void ? null : Data;
					}

					if (typeof middlewareResult.validationErrors !== "undefined") {
						actionResult.validationErrors = middlewareResult.validationErrors as FVE;
					}

					if (typeof middlewareResult.bindArgsValidationErrors !== "undefined") {
						actionResult.bindArgsValidationErrors = middlewareResult.bindArgsValidationErrors as FBAVE;
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
		action: buildAction({ withState: false }).action,
		stateAction: buildAction({ withState: true }).action,
	};
}
