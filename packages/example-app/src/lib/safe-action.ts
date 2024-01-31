import { randomUUID } from "crypto";
import { DEFAULT_SERVER_ERROR, createSafeActionClient } from "next-safe-action";

export class ActionError extends Error {}

const handleReturnedServerError = (e: Error) => {
	// If the error is an instance of `ActionError`, unmask the message.
	if (e instanceof ActionError) {
		return e.message;
	}

	// Otherwise return default error message.
	return DEFAULT_SERVER_ERROR;
};

export const action = createSafeActionClient({
	// You can provide a custom log Promise, otherwise the lib will use `console.error`
	// as the default logging system. If you want to disable server errors logging,
	// just pass an empty Promise.
	handleServerErrorLog: (e) => {
		console.error(
			"CUSTOM ERROR LOG FUNCTION, server error message:",
			e.message
		);
	},
	handleReturnedServerError,
});

export const authAction = createSafeActionClient({
	// You can provide a middleware function. In this case, context is used
	// for (fake) auth purposes.
	middleware(parsedInput) {
		const userId = randomUUID();

		console.log(
			"HELLO FROM ACTION MIDDLEWARE, USER ID:",
			userId,
			"PARSED INPUT:",
			parsedInput
		);

		return userId;
	},
	handleReturnedServerError,
});
