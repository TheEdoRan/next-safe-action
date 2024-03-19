"use server";

import { authAction } from "@/lib/safe-action";
import { maxLength, minLength, object, string } from "valibot";

const input = object({
	fullName: string([minLength(3, "Too short"), maxLength(20, "Too long")]),
	age: string([minLength(2, "Too young"), maxLength(3, "Too old")]),
});

export const editUser = authAction.define(
	input,
	// Here you have access to `userId`, which comes from `buildContext`
	// return object in src/lib/safe-action.ts.
	//                          \\\\\
	async ({ fullName, age }, { userId, sessionId }) => {
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
