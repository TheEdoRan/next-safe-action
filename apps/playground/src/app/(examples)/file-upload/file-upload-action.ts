"use server";

import { action } from "@/lib/safe-action";
import { zfd } from "zod-form-data";

const schema = zfd.formData({
	image: zfd.file(),
});

export const fileUploadAction = action
	.metadata({ actionName: "fileUploadAction" })
	.schema(schema)
	.action(async ({ parsedInput }) => {
		await new Promise((res) => setTimeout(res, 1000));

		// Do something useful with the file.
		console.log("fileUploadAction ->", parsedInput);

		return {
			ok: true,
		};
	});
