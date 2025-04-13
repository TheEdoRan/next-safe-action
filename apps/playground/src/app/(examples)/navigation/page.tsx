"use client";

import { StyledButton } from "@/app/_components/styled-button";
import { StyledHeading } from "@/app/_components/styled-heading";
import { useAction } from "next-safe-action/hooks";
import { ResultBox } from "../../_components/result-box";
import { testNavigate } from "./navigation-action";

export default function Navigation() {
	// Safe action (`deleteUser`) and optional callbacks passed to `useAction` hook.
	const {
		execute,
		executeAsync,
		result,
		status,
		reset,
		isIdle,
		isExecuting,
		isTransitioning,
		isPending,
		hasSucceeded,
		hasErrored,
	} = useAction(testNavigate, {
		onSuccess(args) {
			console.log("HELLO FROM ONSUCCESS", args);
		},
		onError(args) {
			console.log("OH NO FROM ONERROR", args);
		},
		onNavigation(args) {
			console.log("HELLO FROM ONNAVIGATION", args);
		},
		onSettled(args) {
			console.log("HELLO FROM ONSETTLED", args);
		},
		onExecute(args) {
			console.log("HELLO FROM ONEXECUTE", args);
		},
	});

	console.dir({
		result,
		status,
		isIdle,
		isExecuting,
		isTransitioning,
		isPending,
		hasSucceeded,
		hasErrored,
	});

	return (
		<main className="w-96 max-w-full px-4">
			<StyledHeading>Action using hook</StyledHeading>
			<div className="mt-8 flex flex-col space-y-4">
				<StyledButton type="button" onClick={() => execute({ kind: "redirect" })}>
					Redirect
				</StyledButton>
				<StyledButton type="button" onClick={() => execute({ kind: "notFound" })}>
					Not found
				</StyledButton>
				<StyledButton type="button" onClick={() => execute({ kind: "forbidden" })}>
					Forbidden
				</StyledButton>
				<StyledButton type="button" onClick={() => execute({ kind: "unauthorized" })}>
					Unauthorized
				</StyledButton>
				<StyledButton type="button" onClick={() => execute({ kind: "happy-path" })}>
					Happy path
				</StyledButton>
				<StyledButton type="button" onClick={reset}>
					Reset
				</StyledButton>
			</div>
			<ResultBox result={result} status={status} />
		</main>
	);
}
