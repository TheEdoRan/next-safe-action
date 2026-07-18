"use client";

import { useAction } from "next-safe-action/hooks";
import { ExampleCard } from "@/components/example-card";
import { ResultDisplay } from "@/components/result-display";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import type { SourceCode } from "@/lib/shiki";
import { deleteUser } from "../_actions/delete-user-action";

type Props = {
	source?: SourceCode;
};

export function InitResultDemo({ source }: Props) {
	const { execute, result, status, reset } = useAction(deleteUser, {
		// Captured once at mount: `reset()` restores this value instead of clearing the result.
		initResult: { data: { deletedUserId: "preloaded-user" } },
	});

	return (
		<ExampleCard
			title="initResult"
			description="Seed useAction with a preloaded result: result.data is populated while idle, and reset() restores the seeded value (even mid-execution, discarding the in-flight run)."
			source={source}
		>
			<div className="flex gap-2">
				<Button onClick={() => execute({ userId: "user123" })}>Delete user</Button>
				<Button variant="outline" onClick={reset}>
					Reset
				</Button>
			</div>
			<div className="mt-4 flex items-center gap-2">
				<span className="text-sm font-medium">Status:</span>
				<StatusBadge status={status} />
			</div>
			<ResultDisplay result={result} />
		</ExampleCard>
	);
}
