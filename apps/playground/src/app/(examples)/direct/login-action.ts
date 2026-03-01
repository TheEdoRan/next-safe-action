"use server";

import { flattenValidationErrors, returnValidationErrors } from "next-safe-action";
import { z } from "zod";
import { action } from "@/lib/safe-action";

const schema = z.object({
	username: z.string().min(3).max(10),
	password: z.string().min(8).max(100),
});

export const loginUser = action
	.metadata({ actionName: "loginUser" })
	.inputSchema(schema, {
		// Here we use the `flattenValidationErrors` function to customize the returned validation errors
		// object to the client.
		handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors,
	})
	.action(
		async ({ parsedInput: { username, password } }) => {
			if (username === "johndoe") {
				returnValidationErrors(schema, {
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

			returnValidationErrors(schema, {
				username: {
					_errors: ["incorrect_credentials"],
				},
			});
		},
		{
			onSuccess: async (args) => {
				console.log("Logging from onSuccess callback:");
				console.dir(args, { depth: null });
			},
			onError: async (args) => {
				console.log("Logging from onError callback:");
				console.dir(args, { depth: null });
			},
			onSettled: async (args) => {
				console.log("Logging from onSettled callback:");
				console.dir(args, { depth: null });
			},
		}
	);
