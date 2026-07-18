"use server";

import { returnServerError } from "next-safe-action";
import { z } from "zod";
import { action } from "@/lib/safe-action";

const schema = z.object({
	productId: z.string().min(1),
});

export const returnServerErrorAction = action
	.metadata({ actionName: "returnServerErrorAction" })
	.inputSchema(schema)
	.action(async ({ parsedInput: { productId } }) => {
		await new Promise((res) => setTimeout(res, 300));

		if (productId === "out-of-stock") {
			// Expected server error: the value is set as `result.serverError` as-is,
			// bypassing `handleServerError`. Code after this call doesn't execute.
			returnServerError(`Product "${productId}" is sold out`);
		}

		return {
			purchasedProductId: productId,
		};
	});
