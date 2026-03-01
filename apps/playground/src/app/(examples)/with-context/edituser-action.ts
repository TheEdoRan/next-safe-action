"use server";

import { z } from "zod";
import { authAction } from "@/lib/safe-action";

const schema = z.object({
	fullName: z.string().min(3).max(20),
	age: z.string().min(2).max(3),
});

export const editUser = authAction
	.metadata({ actionName: "editUser" })
	.inputSchema(schema)
	.action(
		// Here you have access to `userId`, and `sessionId which comes from middleware functions
		// defined before.
		//                                              \\\\\\\\\\\\\\\\\\
		async ({ parsedInput: { fullName, age }, ctx: { userId, sessionId } }) => {
			if (fullName.toLowerCase() === "john doe") {
				return {
					error: {
						cause: "forbidden_name",
					},
				};
			}

			const intAge = parseInt(age);

			if (Number.isNaN(intAge)) {
				return {
					error: {
						reason: "invalid_age", // different key in `error`, will be correctly inferred
					},
				};
			}

			return {
				success: {
					newFullName: fullName,
					newAge: intAge,
					userId,
					sessionId,
				},
			};
		}
	);
