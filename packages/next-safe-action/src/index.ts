import type { Infer, Schema } from "@typeschema/main";
import type { SafeActionClientOpts } from "./index.types";
import { SafeActionClient } from "./safe-action-client";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "./utils";

export { DEFAULT_SERVER_ERROR_MESSAGE } from "./utils";
export { flattenBindArgsValidationErrors, flattenValidationErrors, returnValidationErrors } from "./validation-errors";

export type * from "./index.types";
export type * from "./validation-errors.types";

/**
 * Create a new safe action client.
 * @param createOpts Optional initialization options
 *
 * {@link https://next-safe-action.dev/docs/safe-action-client/initialization-options See docs for more information}
 */
export const createSafeActionClient = <ServerError = string, MetadataSchema extends Schema | undefined = undefined>(
	createOpts?: SafeActionClientOpts<ServerError, MetadataSchema>
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
		SafeActionClientOpts<ServerError, MetadataSchema>["handleReturnedServerError"]
	>;

	return new SafeActionClient<
		ServerError,
		undefined,
		MetadataSchema extends Schema ? Infer<MetadataSchema> : undefined
	>({
		middlewareFns: [async ({ next }) => next({ ctx: undefined })],
		handleServerErrorLog,
		handleReturnedServerError,
		validationStrategy: "typeschema",
	});
};
