"use server";

import { randomUUID } from "crypto";
import { action } from "@/lib/safe-action";
import { schema } from "./validation";

export const buyProduct = action
	.metadata({ actionName: "buyProduct" })
	.inputSchema(schema)
	.action(async ({ parsedInput: { productId } }) => {
		return {
			productId,
			transactionId: randomUUID(),
			transactionTimestamp: Date.now(),
		};
	});
