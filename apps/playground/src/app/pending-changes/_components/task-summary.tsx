"use client";

import type { Status, Task } from "../_lib/tasks";
import { usePendingStatus, useOptimisticTasks } from "./pending-changes-provider";

const COLUMNS: Status[] = ["todo", "doing", "done"];

/**
 * Second consumer, a sibling of `TaskBoard`. It folds the same pending list over the same server
 * data and therefore stays in step with the board, with no shared component state between them.
 * This is what the pending-changes-list shape buys over holding the state in one component.
 */
export function TaskSummary({ tasks }: { tasks: Task[] }) {
	const optimisticTasks = useOptimisticTasks(tasks);
	const { isPending } = usePendingStatus();

	return (
		<div className="mt-4 flex flex-wrap items-center gap-4 rounded-md border p-3 text-sm">
			{COLUMNS.map((column) => (
				<span key={column} data-testid={`pc-count-${column}`}>
					<span className="capitalize">{column}</span>:{" "}
					<strong>{optimisticTasks.filter((task) => task.status === column).length}</strong>
				</span>
			))}
			<span className="text-muted-foreground ml-auto" data-testid="pc-status">
				{isPending ? "Saving..." : "Idle"}
			</span>
		</div>
	);
}
