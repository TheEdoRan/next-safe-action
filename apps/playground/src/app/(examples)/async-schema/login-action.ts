"use server";

import { action } from "@/lib/safe-action";
import { flattenValidationErrors, returnValidationErrors } from "next-safe-action";
import { z } from "zod";

async function getSchema() {
	return z.object({
		username: z.string().min(3).max(10),
		password: z.string().min(8).max(100),
	});
}

export const loginUser = action
	.metadata({ actionName: "loginUser" })
	.schema(getSchema, {
		// Here we use the `flattenValidationErrors` function to customize the returned validation errors
		// object to the client.
		handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors,
	})
	.action(async ({ parsedInput: { username, password } }) => {
		if (username === "johndoe") {
			returnValidationErrors(getSchema, {
				username: {
					_errors: ["user_suspended"],
				},
			});
		}

		if (username === "user" && password === "password") {
			return {
				success: true,
			};
		}

		returnValidationErrors(getSchema, {
			username: {
				_errors: ["incorrect_credentials"],
			},
		});
	});
