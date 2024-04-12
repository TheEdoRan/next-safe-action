import { randomUUID } from "crypto";
import {
	DEFAULT_SERVER_ERROR_MESSAGE,
	createSafeActionClient,
} from "next-safe-action";

export class ActionError extends Error {}

export const action = createSafeActionClient({
	// You can provide a custom logging function, otherwise the lib will use `console.error`
	// as the default logging system. If you want to disable server errors logging,
	// just pass an empty Promise.
	handleServerErrorLog: (e) => {
		console.error(
			"CUSTOM ERROR LOG FUNCTION, server error message:",
			e.message
		);
	},
	handleReturnedServerError: (e) => {
		// If the error is an instance of `ActionError`, unmask the message.
		if (e instanceof ActionError) {
			return e.message;
		}

		// Otherwise return default error message.
		return DEFAULT_SERVER_ERROR_MESSAGE;
	},
}).use(async ({ next, metadata, clientInput, bindArgsClientInputs }) => {
	// Here we use a logging middleware.
	const start = Date.now();

	// Here we await the next middleware.
	const result = await next({ ctx: null });

	const end = Date.now();

	const durationInMs = end - start;

	const logObject: Record<string, any> = { durationInMs };

	logObject.clientInput = clientInput;
	logObject.bindArgsClientInputs = bindArgsClientInputs;
	logObject.metadata = metadata;
	logObject.result = result;

	console.log("LOGGING FROM MIDDLEWARE:");
	console.dir(logObject, { depth: null });

	// And then return the result of the awaited next middleware.
	return result;
});

async function getSessionId() {
	return randomUUID();
}

export const authAction = action
	// Clone the base client to extend this one with additional middleware functions.
	.clone()
	// In this case, context is used for (fake) auth purposes.
	.use(async ({ next }) => {
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
			"HELLO FROM SECOND AUTH ACTION MIDDLEWARE, SESSION ID:",
			sessionId
		);

		return next({
			ctx: {
				...ctx, // here we spread the previous context to extend it
				sessionId, // with session id
			},
		});
	});
