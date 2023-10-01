import { randomUUID } from "crypto";
import { createSafeActionClient } from "next-safe-action";

export const action = createSafeActionClient({
	// You can provide a custom log Promise, otherwise the lib will use `console.error`
	// as the default logging system. If you want to disable server errors logging,
	// just pass an empty Promise.
	handleServerErrorLog: (e) => {
		console.error("CUSTOM ERROR LOG FUNCTION:", e);
	},
});

export const authAction = createSafeActionClient({
	// You can provide a context builder function. In this case, context is used
	// for (fake) auth purposes.
	buildContext: () => {
		return {
			userId: randomUUID(),
		};
	},
	middleware(ctx) {
		console.log("HELLO FROM ACTION MIDDLEWARE, USER ID:", ctx.userId);
	},
});
