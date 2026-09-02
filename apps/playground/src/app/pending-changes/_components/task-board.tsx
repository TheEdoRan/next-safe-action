"use client";

import { Button } from "@/components/ui/button";
import type { Status, Task } from "../_lib/tasks";
import { useMoveTask, useOptimisticTasks } from "./pending-changes-provider";

const COLUMNS: Status[] = ["todo", "doing", "done"];

/**
 * First consumer. Receives the confirmed server data and folds the shared pending list over it.
 * It does not own that list, and it does not know the other consumer exists.
 */
export function TaskBoard({ tasks }: { tasks: Task[] }) {
	const optimisticTasks = useOptimisticTasks(tasks);
	const move = useMoveTask();

	return (
		<div className="grid gap-4 sm:grid-cols-3" data-testid="pc-board">
			{COLUMNS.map((column) => (
				<div key={column} className="rounded-md border p-3">
					<h4 className="text-sm font-medium capitalize">{column}</h4>
					<ul className="mt-2 space-y-2" data-testid={`pc-column-${column}`}>
						{optimisticTasks
							.filter((task) => task.status === column)
							.map((task) => (
								<li key={task.id} className="rounded-md border p-2 text-sm" data-testid={`pc-task-${task.id}`}>
									<span>{task.label}</span>
									<span className="mt-2 flex flex-wrap gap-1">
										{COLUMNS.filter((target) => target !== column).map((target) => (
											<Button
												key={target}
												size="sm"
												variant="outline"
												data-testid={`pc-move-${task.id}-${target}`}
												onClick={() => move({ id: task.id, to: target })}
											>
												{target}
											</Button>
										))}
									</span>
								</li>
							))}
					</ul>
				</div>
			))}
		</div>
	);
}
