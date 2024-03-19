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

async function getSessionId() {
	return randomUUID();
}

export const authAction = createSafeActionClient({
	handleReturnedServerError,
})
	// Middleware can be async/non async.
	.use(() => {
		// You can provide a middleware function. In this case, context is used
		// for (fake) auth purposes.
		const userId = randomUUID();

		console.log("HELLO FROM FIRST AUTH ACTION MIDDLEWARE, USER ID:", userId);

		return {
			nextCtx: {
				userId,
			},
		};
	})
	// Here we get `userId` from the previous context, all type safe.
	.use(async ({ ctx }) => {
		const sessionId = await getSessionId();

		console.log(
			"HELLO FROM SECOND AUTH ACTION MIDDLEWARE, USER ID:",
			sessionId
		);

		return {
			// Here we extend the previous context with session data.
			nextCtx: {
				...ctx,
				sessionId,
			},
		};
	});
