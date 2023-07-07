"use server";

import { action } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { incrementLikes } from "./db";

const inputValidator = z.object({
	incrementBy: z.number(),
});

export const addLikes = action(inputValidator, async ({ incrementBy }) => {
	await new Promise((res) => setTimeout(res, 2000));

	const likesCount = incrementLikes(incrementBy);

	// This Next.js function revalidates the provided path.
	// More info here: https://nextjs.org/docs/app/api-reference/functions/revalidatePath
	revalidatePath("/optimistic-hook");

	return {
		likesCount,
	};
});
