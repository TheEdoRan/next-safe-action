import type { DVES, SafeActionClientOpts } from "./index.types";
import { SafeActionClient } from "./safe-action-client";
import { InferOutputOrDefault, StandardSchemaV1 } from "./standard.types";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "./utils";
import {
	flattenBindArgsValidationErrors,
	flattenValidationErrors,
	formatBindArgsValidationErrors,
	formatValidationErrors,
} from "./validation-errors";

export { createMiddleware } from "./middleware";
export { DEFAULT_SERVER_ERROR_MESSAGE } from "./utils";
export {
	ActionMetadataValidationError,
	ActionOutputDataValidationError,
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
 * {@link https://next-safe-action.dev/docs/define-actions/create-the-client#initialization-options See docs for more information}
 */
export const createSafeActionClient = <
	ODVES extends DVES | undefined = undefined,
	ServerError = string,
	MetadataSchema extends StandardSchemaV1 | undefined = undefined,
>(
	createOpts?: SafeActionClientOpts<ServerError, MetadataSchema, ODVES>
) => {
	// If `handleServerError` is provided, use it, otherwise default to log to console and generic error message.
	const handleServerError: NonNullable<SafeActionClientOpts<ServerError, MetadataSchema, ODVES>["handleServerError"]> =
		createOpts?.handleServerError ||
		((e) => {
			console.error("Action error:", e.message);
			return DEFAULT_SERVER_ERROR_MESSAGE as ServerError;
		});

	return new SafeActionClient({
		middlewareFns: [async ({ next }) => next({ ctx: {} })],
		handleServerError,
		inputSchemaFn: undefined,
		bindArgsSchemas: [],
		outputSchema: undefined,
		ctxType: {},
		metadataSchema: (createOpts?.defineMetadataSchema?.() ?? undefined) as MetadataSchema,
		metadata: undefined as InferOutputOrDefault<MetadataSchema, undefined>,
		defaultValidationErrorsShape: (createOpts?.defaultValidationErrorsShape ?? "formatted") as ODVES,
		throwValidationErrors: Boolean(createOpts?.throwValidationErrors),
		handleValidationErrorsShape: async (ve) =>
			createOpts?.defaultValidationErrorsShape === "flattened"
				? flattenValidationErrors(ve)
				: formatValidationErrors(ve),
		handleBindArgsValidationErrorsShape: async (ve) =>
			createOpts?.defaultValidationErrorsShape === "flattened"
				? flattenBindArgsValidationErrors(ve)
				: formatBindArgsValidationErrors(ve),
	});
};
