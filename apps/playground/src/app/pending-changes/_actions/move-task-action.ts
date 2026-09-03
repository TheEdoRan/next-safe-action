"use server";

import { revalidatePath } from "next/cache";
import { action } from "@/lib/safe-action";
import type { Task } from "../_lib/tasks";
import { applyChange, changeSchema, INITIAL_TASKS } from "../_lib/tasks";

// Stands in for the database.
let stored: Task[] = INITIAL_TASKS;
export const getTasks = async () => stored;

export const moveTask = action
	.metadata({ actionName: "moveTask" })
	.inputSchema(changeSchema)
	.stateAction(async ({ parsedInput }) => {
		// Slow enough to click through, so overlapping dispatches are easy to trigger.
		await new Promise((res) => setTimeout(res, 1200));

		stored = applyChange(stored, parsedInput);

		// The list shape needs this. The action returns nothing, so the only way confirmed state can
		// advance is a fresh `currentState` from the server: without a revalidation the pending list
		// would drain onto unchanged data and the change would visibly revert.
		revalidatePath("/pending-changes");

		// Returns nothing on purpose. Confirmed state stays with the Server Component, so the hook
		// holds only the list of pending changes and every consumer folds it over its own data.
	});
