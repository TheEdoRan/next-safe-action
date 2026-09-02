import { z } from "zod";

export const changeSchema = z.object({
	id: z.string(),
	to: z.enum(["todo", "doing", "done"]),
});

export type Change = z.infer<typeof changeSchema>;
export type Status = Change["to"];
export type Task = { id: string; label: string; status: Status };

export const INITIAL_TASKS: Task[] = [
	{ id: "t1", label: "Write the RFC", status: "todo" },
	{ id: "t2", label: "Review the PR", status: "doing" },
	{ id: "t3", label: "Ship the release", status: "todo" },
	{ id: "t4", label: "Close the incident", status: "done" },
];

/**
 * Applies one pending change to a list of tasks. Consumers fold the whole pending list over their
 * own server data with this, so every component sees the same in-flight result without any of them
 * owning the state.
 *
 * Lives outside the `"use server"` module because every export there must be a server action.
 */
export function applyChange(tasks: Task[], change: Change): Task[] {
	return tasks.map((task) => (task.id === change.id ? { ...task, status: change.to } : task));
}
