"use server";

import { action } from "@/lib/safe-action";
import { z } from "zod";
import { zfd } from "zod-form-data";

const schema = zfd.formData({
	name: zfd.text(z.string().min(1).max(20)),
});

export const statelessFormAction = action
	.metadata({ actionName: "statelessFormAction" })
	.schema(schema)
	.action(async ({ parsedInput }) => {
		await new Promise((res) => setTimeout(res, 1000));

		return {
			newName: parsedInput.name,
		};
	});
