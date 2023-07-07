"use server";

import { action } from "@/lib/safe-action";
import { z } from "zod";

const inputValidator = z.object({
	fullName: z.string().min(3).max(50),
	age: z.string().min(1).max(3),
});

export const editUser = action(
	{ input: inputValidator, withAuth: true }, // auth action
	// Here you have access to `userId`, which comes from `getAuthData`
	// return object in src/lib/safe-action.ts.
	//                          \\\\\
	async ({ fullName, age }, { userId }) => {
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
			},
		};
	}
);
