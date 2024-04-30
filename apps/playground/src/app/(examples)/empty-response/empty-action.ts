"use server";

import { action } from "@/lib/safe-action";
import { z } from "zod";

const schema = z.object({
	userId: z.string().uuid(),
});

export const emptyAction = action
	.metadata({ actionName: "emptyAction" })
	.schema(schema)
	.action(async () => {
		await new Promise((res) => setTimeout(res, 500));
	});
