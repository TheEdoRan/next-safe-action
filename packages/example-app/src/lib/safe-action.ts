import { randomBytes } from "crypto";
import { createSafeActionClient } from "next-safe-action";

const action = createSafeActionClient({
	// You can provide a custom function, otherwise the lib will use `console.error`
	// as the default logging system. If you want to disable server errors logging,
	// just pass an empty function.
	serverErrorLogFunction: (e) => {
		console.error("CUSTOM ERROR LOG FUNCTION:", e);
	},
	// This is required when you pass `withAuth: true` to safe actions.
	// Defining an action with `withAuth: true` option without implementing
	// the `getAuthData` function, results in a server error on action execution.
	// The return object of this function will be passed as the second parameter of
	// a server action definition function, where you provided `withAuth: true` as
	// an option.
	// Check `editUser` action in `src/app/withauth/edituser-action.ts` file for a
	// practical example.
	getAuthData: async () => {
		return {
			userId: randomBytes(6).toString("hex"),
		};
	},
});

export { action };
