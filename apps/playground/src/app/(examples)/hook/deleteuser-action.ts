"use server";

import { ActionError, action } from "@/lib/safe-action";
import { flattenValidationErrors } from "next-safe-action";
import { z } from "zod";

const schema = z.object({
	userId: z.string().min(1).max(10),
});

export const deleteUser = action
	.metadata({ actionName: "deleteUser" })
	.inputSchema(schema, { handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve) })
	.action(
		async ({ parsedInput: { userId } }) => {
			await new Promise((res) => setTimeout(res, 1000));

			if (Math.random() > 0.5) {
				throw new ActionError("Could not delete user!");
			}

			return {
				deletedUserId: userId,
			};
		},
		{
			throwValidationErrors: {
				async overrideErrorMessage(validationErrors) {
					return validationErrors.fieldErrors.userId?.[0] ?? "Invalid user ID";
				},
			},
		}
	);
