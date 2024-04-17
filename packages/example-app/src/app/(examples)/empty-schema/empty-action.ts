"use server";

import { action } from "@/lib/safe-action";

export const emptyAction = action
	.metadata({ actionName: "onboardUser" })
	.schema()
	.action(async () => {
		await new Promise((res) => setTimeout(res, 500));

		return {
			message: "Well done!",
		};
	});
