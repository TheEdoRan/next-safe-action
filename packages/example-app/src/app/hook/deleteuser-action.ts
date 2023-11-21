"use server";

import { action } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

let userId = "";

export const getUserId = () => userId;

const updateUserId = (newUserId: string) => {
	userId = newUserId;
	return userId;
};

const input = z.object({
	userId: z.string().min(1).max(10),
});

export const deleteUser = action(input, async ({ userId }) => {
	await new Promise((res) => setTimeout(res, 1000));

	updateUserId(userId);

	// This Next.js function revalidates the provided path.
	// More info here: https://nextjs.org/docs/app/api-reference/functions/revalidatePath
	revalidatePath("/hook");

	return {
		deleted: true,
	};
});
