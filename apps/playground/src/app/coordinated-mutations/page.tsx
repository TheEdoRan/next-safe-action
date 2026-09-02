import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { readAndHighlightFile } from "@/lib/shiki";
import type { SourceCode } from "@/lib/shiki";
import { getItems } from "./_actions/reorder-action";
import { ReorderList } from "./_components/reorder-list";

async function ReorderSection({ source }: { source: SourceCode }) {
	// The stand-in database is request-time state, so it must not be prerendered.
	await connection();
	const items = await getItems();

	return <ReorderList items={items} source={source} />;
}

export default async function CoordinatedMutationsPage() {
	const source = await readAndHighlightFile("coordinated-mutations/_actions/reorder-action.ts");

	return (
		<div>
			<PageHeader
				title="Coordinating Mutations"
				description="useOptimisticStateAction queues overlapping writes and folds every in-flight change over the confirmed state."
			/>
			<Suspense fallback={<p className="text-muted-foreground text-sm">Loading items...</p>}>
				<ReorderSection source={source} />
			</Suspense>
		</div>
	);
}
