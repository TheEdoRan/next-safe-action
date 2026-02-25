"use server";

import { action } from "@/lib/safe-action";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import {
	REVALIDATION_CALLBACKS_TAG,
	mutateRevalidationCallbacksState,
} from "./revalidation-callbacks-store";

const schema = z.object({
	kind: z.enum(["revalidatePath", "revalidateTag"]),
});

export const testRevalidationCallbacks = action
	.metadata({ actionName: "testRevalidationCallbacks" })
	.inputSchema(schema)
	.action(async ({ parsedInput: { kind } }) => {
		await new Promise((res) => setTimeout(res, 600));

		const snapshot = mutateRevalidationCallbacksState(kind);

		if (kind === "revalidatePath") {
			revalidatePath("/revalidation-callbacks");
		} else {
			revalidateTag(REVALIDATION_CALLBACKS_TAG);
		}

		return {
			ok: true,
			kind,
			snapshot,
			serverTimestamp: new Date().toISOString(),
		};
	});
