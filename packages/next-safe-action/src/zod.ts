import type { Schema } from "@typeschema/main";
import type { SafeActionClientOpts } from "./index.types";
import { createClientWithStrategy } from "./safe-action-client";

export { DEFAULT_SERVER_ERROR_MESSAGE } from "./utils";
export { flattenBindArgsValidationErrors, flattenValidationErrors, returnValidationErrors } from "./validation-errors";

export type * from "./index.types";
export type * from "./validation-errors.types";

/**
 * Create a new safe action client.
 * Note: this client only works with Zod as the validation library.
 * This is needed when TypeSchema causes problems in your application.
 * Check out the [troubleshooting](https://next-safe-action.dev/docs/troubleshooting/errors-with-typeschema) page of the docs for more information.
 * @param createOpts Optional initialization options
 *
 * {@link https://next-safe-action.dev/docs/safe-action-client/initialization-options See docs for more information}
 */
export const createSafeActionClient = <ServerError = string, MetadataSchema extends Schema | undefined = undefined>(
	createOpts?: SafeActionClientOpts<ServerError, MetadataSchema>
) => {
	return createClientWithStrategy("zod", createOpts);
};
