"use server";

import { action } from "@/lib/safe-action";
import { randomUUID } from "crypto";
import { schema } from "./validation";

export const buyProduct = action(schema, async ({ productId }) => {
	return {
		productId,
		transactionId: randomUUID(),
		transactionTimestamp: Date.now(),
	};
});
