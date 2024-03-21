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
	// Here we use a logging middleware.
	.use(async ({ next, clientInput }) => {
		const start = Date.now();
		console.log("LOGGING MIDDLEWARE: clientInput:", clientInput);

		// Here we await the next middleware.
		const result = await next({ ctx: {} });

		const end = Date.now();

		// Log the execution time of the action.
		console.log(
			"LOGGING MIDDLEWARE: this action took",
			end - start,
			"ms to execute"
		);

		// And then return the result of the awaited next middleware.
		return result;
	})
	.use(async ({ next }) => {
		// In this case, context is used for (fake) auth purposes.
		const userId = randomUUID();

		console.log("HELLO FROM FIRST AUTH ACTION MIDDLEWARE, USER ID:", userId);

		return next({
			ctx: {
				userId,
			},
		});
	})
	// Here we get `userId` from the previous context, and it's all type safe.
	.use(async ({ ctx, next }) => {
		// Emulate a slow server.
		await new Promise((res) =>
			setTimeout(res, Math.max(Math.random() * 2000, 500))
		);

		const sessionId = await getSessionId();

		console.log(
			"HELLO FROM SECOND AUTH ACTION MIDDLEWARE, USER ID:",
			sessionId
		);

		return next({
			ctx: {
				...ctx, // here we spread the previous context to extend it
				sessionId, // with session id
			},
		});
	});
