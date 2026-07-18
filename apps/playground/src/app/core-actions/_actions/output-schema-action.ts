"use server";

import { z } from "zod";
import { action } from "@/lib/safe-action";

const inputSchema = z.object({
	name: z.string().min(1).max(50),
});

// Output transforms apply to the returned data, mirroring input validation semantics:
// the client receives the transformed values, not the raw return.
const outputSchema = z.object({
	greeting: z.string().transform((g) => g.toUpperCase()),
	timestamp: z.number(),
});

export const outputSchemaAction = action
	.metadata({ actionName: "outputSchemaAction" })
	.inputSchema(inputSchema)
	.outputSchema(outputSchema)
	.action(async ({ parsedInput: { name } }) => {
		await new Promise((res) => setTimeout(res, 300));
		return {
			greeting: `Hello, ${name}!`,
			timestamp: Date.now(),
		};
	});
