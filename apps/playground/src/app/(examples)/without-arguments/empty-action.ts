"use server";

import { action } from "@/lib/safe-action";

export const emptyAction = action
	.metadata({ actionName: "onboardUser" })
	.action(async (obj) => {
		console.log("OBJ ->", obj);

		await new Promise((res) => setTimeout(res, 500));

		return {
			message: "Well done!",
		};
	});
