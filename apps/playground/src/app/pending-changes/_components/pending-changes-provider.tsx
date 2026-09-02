"use client";

import { useOptimisticStateAction } from "next-safe-action/hooks";
import { createContext, use, type ReactNode } from "react";
import { moveTask } from "../_actions/move-task-action";
import type { Change, Task } from "../_lib/tasks";
import { applyChange } from "../_lib/tasks";

// Hoisted, so it keeps the same identity on every render. `currentState` is compared by identity:
// an inline `[]` would be a new value each time, and the pending list would never accumulate.
const NO_PENDING: Change[] = [];

const PendingChangesContext = createContext<Change[] | null>(null);
const DispatchContext = createContext<((change: Change) => void) | null>(null);
const StatusContext = createContext<{ isPending: boolean } | null>(null);

export function PendingChangesProvider({ children }: { children: ReactNode }) {
	// The action returns nothing, so confirmed state stays the constant base and this hook holds
	// only what is in flight. Dispatches are still queued, so the writes never overtake each other.
	const {
		optimisticState: pendingChanges,
		execute,
		isPending,
	} = useOptimisticStateAction(moveTask, {
		currentState: NO_PENDING,
		updateFn: (changes, change) => [...changes, change],
	});

	return (
		<StatusContext value={{ isPending }}>
			<PendingChangesContext value={pendingChanges}>
				<DispatchContext value={execute}>{children}</DispatchContext>
			</PendingChangesContext>
		</StatusContext>
	);
}

function useRequiredContext<T>(context: React.Context<T | null>, name: string): T {
	const value = use(context);

	if (value === null) {
		throw new Error(`${name} must be used inside PendingChangesProvider`);
	}

	return value;
}

/** Folds every in-flight change over this consumer's own server data. */
export function useOptimisticTasks(tasks: Task[]): Task[] {
	const pendingChanges = useRequiredContext(PendingChangesContext, "useOptimisticTasks");

	return pendingChanges.reduce(applyChange, tasks);
}

export function useMoveTask() {
	return useRequiredContext(DispatchContext, "useMoveTask");
}

export function usePendingStatus() {
	return useRequiredContext(StatusContext, "usePendingStatus");
}
