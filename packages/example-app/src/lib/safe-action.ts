import { randomUUID } from "crypto";
import { createSafeActionClient } from "next-safe-action";

export const action = createSafeActionClient({
	// You can provide a custom log function, otherwise the lib will use `console.error`
	// as the default logging system. If you want to disable server errors logging,
	// just pass an empty function.
	serverErrorLogFunction: (e) => {
		console.error("CUSTOM ERROR LOG FUNCTION:", e);
	},
});

export const authAction = createSafeActionClient({
	// You can provide a context builder function. In this case, context is used
	// for (fake) auth purposes.
	buildContext: async () => {
		return {
			userId: randomUUID(),
		};
	},
});
