"use server";

import { action } from "@/lib/safe-action";

export const noargsAction = action
	.metadata({ actionName: "noargsAction" })
	.action(async () => {
		await new Promise((res) => setTimeout(res, 500));

		return {
			message: "Well done!",
		};
	});
