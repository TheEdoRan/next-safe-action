"use server";

import { ActionError, action } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

let likes = 42;

export const getLikes = async () => likes;

const incrementLikes = (by: number) => {
	likes += by;
	return likes;
};

const schema = z.object({
	incrementBy: z.number(),
});

export const addLikes = action
	.metadata({ actionName: "addLikes" })
	.schema(schema)
	.action(async ({ parsedInput: { incrementBy } }) => {
		await new Promise((res) => setTimeout(res, 500));

		if (Math.random() > 0.5) {
			throw new ActionError(
				"Could not update likes right now, please try again later."
			);
		}

		const likesCount = incrementLikes(incrementBy);

		// This Next.js function revalidates the provided path.
		// More info here: https://nextjs.org/docs/app/api-reference/functions/revalidatePath
		revalidatePath("/optimistic-hook");

		return {
			likesCount,
		};
	});
