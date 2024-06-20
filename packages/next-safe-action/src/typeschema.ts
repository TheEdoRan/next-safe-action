import type { Infer, Schema } from "@typeschema/main";
import type { DVES, SafeActionClientOpts } from "./index.types";
import { SafeActionClient } from "./safe-action-client";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "./utils";
import {
	flattenBindArgsValidationErrors,
	flattenValidationErrors,
	formatBindArgsValidationErrors,
	formatValidationErrors,
} from "./validation-errors";

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
 * If you want to use a validation library supported by [TypeSchema](https://typeschema.com), import this client from `/typeschema` path.
 * @param createOpts Optional initialization options
 *
 * {@link https://next-safe-action.dev/docs/safe-action-client/initialization-options See docs for more information}
 */
export const createSafeActionClient = <
	ODVES extends DVES | undefined = undefined,
	ServerError = string,
	MetadataSchema extends Schema | undefined = undefined,
>(
	createOpts?: SafeActionClientOpts<ServerError, MetadataSchema, ODVES>
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
		SafeActionClientOpts<ServerError, MetadataSchema, ODVES>["handleReturnedServerError"]
	>;

	return new SafeActionClient({
		middlewareFns: [async ({ next }) => next({ ctx: undefined })],
		handleServerErrorLog,
		handleReturnedServerError,
		validationStrategy: "typeschema",
		schemaFn: undefined,
		bindArgsSchemas: [],
		ctxType: undefined,
		metadataSchema: createOpts?.defineMetadataSchema?.(),
		metadata: undefined as MetadataSchema extends Schema ? Infer<MetadataSchema> : undefined,
		defaultValidationErrorsShape: (createOpts?.defaultValidationErrorsShape ?? "formatted") as ODVES,
		throwValidationErrors: Boolean(createOpts?.throwValidationErrors),
		handleValidationErrorsShape:
			createOpts?.defaultValidationErrorsShape === "flattened" ? flattenValidationErrors : formatValidationErrors,
		handleBindArgsValidationErrorsShape:
			createOpts?.defaultValidationErrorsShape === "flattened"
				? flattenBindArgsValidationErrors
				: formatBindArgsValidationErrors,
	});
};
