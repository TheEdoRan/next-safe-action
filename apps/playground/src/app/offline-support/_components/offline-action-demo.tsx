"use client";

import { useAction } from "next-safe-action/hooks";
import { useOffline } from "next/offline";
import { ExampleCard } from "@/components/example-card";
import { Button } from "@/components/ui/button";
import { incrementAction } from "../_actions/increment-action";

export function OfflineActionDemo() {
	const isOffline = useOffline();
	const { execute, isPending, hasSucceeded, result } = useAction(incrementAction);
	const state = isPending ? (isOffline ? "Offline" : "Pending") : hasSucceeded ? "Success" : "Idle";

	return (
		<ExampleCard
			title="Offline Server Action"
			description="Start the action while offline. Next.js keeps it pending and completes it automatically after reconnection."
		>
			<div className="space-y-4">
				<Button data-testid="offline-action-button" disabled={isPending} onClick={() => execute()}>
					{isPending ? (isOffline ? "Offline. Waiting to retry..." : "Running action...") : "Run action"}
				</Button>
				<p className="text-sm">
					State: <strong data-testid="offline-action-state">{state}</strong>
				</p>
				<pre
					className="bg-muted min-h-20 overflow-auto rounded-md border p-3 font-mono text-sm"
					data-testid="offline-action-result"
				>
					{result.data ? JSON.stringify(result.data, null, 2) : "No result yet."}
				</pre>
			</div>
		</ExampleCard>
	);
}
