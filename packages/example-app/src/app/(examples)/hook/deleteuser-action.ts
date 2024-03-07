"use server";

import { ActionError, action } from "@/lib/safe-action";
import { z } from "zod";

const input = z.object({
	userId: z.string().min(1).max(10),
});

export const deleteUser = action(input, async ({ userId }) => {
	await new Promise((res) => setTimeout(res, 1000));

	if (Math.random() > 0.5) {
		throw new ActionError("Could not delete user!");
	}

	return {
		deletedUserId: userId,
	};
});
