import type { Infer, Schema } from "./adapters/types";
import { zodAdapter } from "./adapters/zod";
import type { DVES, SafeActionClientOpts } from "./index.types";
import { SafeActionClient } from "./safe-action-client";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "./utils";
import {
	flattenBindArgsValidationErrors,
	flattenValidationErrors,
	formatBindArgsValidationErrors,
	formatValidationErrors,
} from "./validation-errors";
import type { HandleBindArgsValidationErrorsShapeFn, HandleValidationErrorsShapeFn } from "./validation-errors.types";

export { createMiddleware } from "./middleware";
export { ActionMetadataError, DEFAULT_SERVER_ERROR_MESSAGE } from "./utils";
export {
	ActionValidationError,
	flattenBindArgsValidationErrors,
	flattenValidationErrors,
	formatBindArgsValidationErrors,
	formatValidationErrors,
	returnValidationErrors,
} from "./validation-errors";

export type * from "./index.types";
export type * from "./validation-errors.types";

/**
 * Create a new safe action client.
 * Note: this client only works with Zod as the validation library.
 * @param createOpts Initialization options
 *
 * {@link https://next-safe-action.dev/docs/safe-action-client/initialization-options See docs for more information}
 */
export const createSafeActionClient = <
	ServerError = string,
	MetadataSchema extends Schema | undefined = undefined,
	ODVES extends DVES | undefined = undefined,
	CVE = undefined,
	CBAVE = undefined,
>(
	createOpts?: SafeActionClientOpts<ServerError, MetadataSchema, ODVES>
): SafeActionClient<
	ServerError,
	ODVES,
	MetadataSchema,
	MetadataSchema extends Schema ? Infer<MetadataSchema> : undefined,
	{},
	undefined,
	undefined,
	readonly [],
	CVE,
	CBAVE
> => {
	// If server log function is not provided, default to `console.error` for logging
	// server error messages.
	const handleServerErrorLog =
		createOpts?.handleServerErrorLog ||
		(((originalError: Error) => {
			console.error("Action error:", originalError.message);
		}) as unknown as NonNullable<SafeActionClientOpts<ServerError, MetadataSchema, ODVES>["handleServerErrorLog"]>);

	// If `handleReturnedServerError` is provided, use it to handle server error
	// messages returned on the client.
	// Otherwise mask the error and use a generic message.
	const handleReturnedServerError =
		createOpts?.handleReturnedServerError ||
		((() => DEFAULT_SERVER_ERROR_MESSAGE) as unknown as NonNullable<
			SafeActionClientOpts<ServerError, MetadataSchema, ODVES>["handleReturnedServerError"]
		>);

	return new SafeActionClient({
		middlewareFns: [async ({ next }) => next({ ctx: {} })],
		handleServerErrorLog,
		handleReturnedServerError,
		schemaFn: undefined,
		bindArgsSchemas: [],
		validationAdapter: createOpts?.validationAdapter ?? zodAdapter(), // use zod adapter by default
		ctxType: {},
		metadataSchema: (createOpts?.defineMetadataSchema?.() ?? undefined) as MetadataSchema,
		metadata: undefined as MetadataSchema extends Schema ? Infer<MetadataSchema> : undefined,
		defaultValidationErrorsShape: (createOpts?.defaultValidationErrorsShape ?? "formatted") as ODVES,
		throwValidationErrors: Boolean(createOpts?.throwValidationErrors),
		handleValidationErrorsShape: (createOpts?.defaultValidationErrorsShape === "flattened"
			? flattenValidationErrors
			: formatValidationErrors) as unknown as HandleValidationErrorsShapeFn<undefined, CVE>,
		handleBindArgsValidationErrorsShape: (createOpts?.defaultValidationErrorsShape === "flattened"
			? flattenBindArgsValidationErrors
			: formatBindArgsValidationErrors) as HandleBindArgsValidationErrorsShapeFn<readonly [], CBAVE>,
	});
};
