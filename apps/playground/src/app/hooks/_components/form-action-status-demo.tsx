"use client";

import { useAction, useStateAction } from "next-safe-action/hooks";
import { ExampleCard } from "@/components/example-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SourceCode } from "@/lib/shiki";
import { formActionStatusAction, formActionStatusStateAction } from "../_actions/form-action-status-action";

type Props = {
	source?: SourceCode;
};

/**
 * Regression demo for issue #470.
 *
 * React invokes a `<form action={fn}>` handler inside its own transition, and Next's router
 * suspends on the RSC response while holding that same lane. Dispatch-time hook state that is
 * scheduled inside that transition is therefore never committed until the action settles, which
 * used to leave `status` reading `idle` (and `isPending` false) for the whole request.
 *
 * jsdom cannot reproduce that: it takes a real Next.js router suspending on a real RSC response.
 * This demo is the only place the production mechanism is covered, so keep it wired to a real
 * form action and keep the delay long enough for the E2E assertions to land mid-flight.
 */
export function FormActionStatusDemo({ source }: Props) {
	const stateless = useAction(formActionStatusAction);
	const stateful = useStateAction(formActionStatusStateAction);

	// `input` is the raw FormData the form action was dispatched with, so reading it back proves
	// dispatch-time state committed while the action was still running.
	const submittedName = stateless.input instanceof FormData ? stateless.input.get("name") : null;

	return (
		<ExampleCard
			title="Form Action Status"
			description="Status reporting for <form action={...}> submits, where React owns the surrounding transition."
			source={source}
		>
			<div className="space-y-6">
				<form action={stateless.execute} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="fas-name">Name (useAction)</Label>
						<Input defaultValue="Ada" id="fas-name" name="name" />
					</div>
					<div className="flex gap-2">
						<Button data-testid="fas-submit" disabled={stateless.isPending} type="submit">
							{stateless.isPending ? "Submitting..." : "Submit"}
						</Button>
						<Button data-testid="fas-reset" onClick={() => stateless.reset()} type="button" variant="outline">
							Reset
						</Button>
					</div>
					<p className="text-sm">
						Status: <strong data-testid="fas-status">{stateless.status}</strong> / pending:{" "}
						<strong data-testid="fas-pending">{String(stateless.isPending)}</strong> / input:{" "}
						<strong data-testid="fas-input">{typeof submittedName === "string" ? submittedName : "none"}</strong>
					</p>
				</form>

				<form action={stateful.formAction} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="fas-state-name">Name (useStateAction)</Label>
						<Input defaultValue="Grace" id="fas-state-name" name="name" />
					</div>
					<div className="flex gap-2">
						<Button data-testid="fas-state-submit" disabled={stateful.isPending} type="submit">
							{stateful.isPending ? "Submitting..." : "Submit"}
						</Button>
						<Button data-testid="fas-state-reset" onClick={() => stateful.reset()} type="button" variant="outline">
							Reset
						</Button>
					</div>
					<p className="text-sm">
						Status: <strong data-testid="fas-state-status">{stateful.status}</strong> / pending:{" "}
						<strong data-testid="fas-state-pending">{String(stateful.isPending)}</strong>
					</p>
				</form>
			</div>
		</ExampleCard>
	);
}
