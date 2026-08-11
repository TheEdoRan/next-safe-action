"use server";

import { action } from "@/lib/safe-action";

let count = 0;

export const incrementAction = action.metadata({ actionName: "incrementAction" }).action(async () => ({
	count: ++count,
	serverTimestamp: new Date().toISOString(),
}));
