import { connection } from "next/server";
import { Suspense } from "react";
import { ExampleCard } from "@/components/example-card";
import { PageHeader } from "@/components/page-header";
import { readAndHighlightFile } from "@/lib/shiki";
import { getTasks } from "./_actions/move-task-action";
import { PendingChangesProvider } from "./_components/pending-changes-provider";
import { TaskBoard } from "./_components/task-board";
import { TaskSummary } from "./_components/task-summary";

async function TasksSection() {
	// The stand-in database is request-time state, so it must not be prerendered.
	await connection();
	const tasks = await getTasks();

	return (
		<PendingChangesProvider>
			<TaskBoard tasks={tasks} />
			<TaskSummary tasks={tasks} />
		</PendingChangesProvider>
	);
}

export default async function PendingChangesPage() {
	const source = await readAndHighlightFile("pending-changes/_components/pending-changes-provider.tsx");

	return (
		<div>
			<PageHeader
				title="Pending Changes"
				description="useOptimisticStateAction holding only the in-flight changes, folded over server data by two sibling components."
			/>
			<ExampleCard
				title="Shared Pending List"
				description="The action returns nothing, so confirmed state stays in the Server Component. The provider holds the queue of pending changes and every consumer replays it over its own data."
				source={source}
			>
				<Suspense fallback={<p className="text-muted-foreground text-sm">Loading tasks...</p>}>
					<TasksSection />
				</Suspense>

				<p className="text-muted-foreground mt-4 text-sm">
					Each save takes 1.2s. Move several tasks quickly: the board and the counters below it update together
					immediately, the writes are serialized rather than raced, and the pending list drains as the queue settles.
				</p>
			</ExampleCard>
		</div>
	);
}
