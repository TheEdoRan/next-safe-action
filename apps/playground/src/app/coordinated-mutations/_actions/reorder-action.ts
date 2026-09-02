"use server";

import { revalidatePath } from "next/cache";
import { action } from "@/lib/safe-action";
import type { Item } from "../_lib/reorder";
import { INITIAL_ITEMS, moveSchema, reorder } from "../_lib/reorder";

// Stands in for the database.
let stored: Item[] = INITIAL_ITEMS;
export const getItems = async () => stored;

// `reset()` only restores the hook's client-side baseline, so without this the demo's server list
// would stay reordered and the two would disagree until a reload.
export const resetItems = async () => {
	stored = INITIAL_ITEMS;
	// Revalidate so the fresh order reaches `currentState`, which supersedes the client-side fold.
	revalidatePath("/coordinated-mutations");
};

export const moveItem = action
	.metadata({ actionName: "moveItem" })
	.inputSchema(moveSchema)
	.stateAction(async ({ parsedInput }, { prevResult }) => {
		// Slow enough to click through, so overlapping dispatches are easy to trigger.
		await new Promise((res) => setTimeout(res, 1200));

		// Always defined: `useOptimisticStateAction` substitutes the last confirmed state when a
		// dispatch fails, so one rejected write can't leave the queue without a base.
		const next = reorder(prevResult.data!, parsedInput);
		stored = next;

		// Required, even though the action already returns the next state. `resetItems` revalidates,
		// so without this the newest payload the page ever receives is the one `resetItems` produced,
		// which predates this write. A fresh `currentState` always supersedes the committed result, so
		// that stale payload would land after this move and silently undo it. Every action that writes
		// the state the page renders has to revalidate, otherwise arrival order stops matching write
		// order.
		revalidatePath("/coordinated-mutations");

		return next;
	});
