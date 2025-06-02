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
		hasSucceeded,
		hasErrored,
	} = useAction(testNavigate, {
		onSuccess(args) {
			console.log("onSuccess callback:", args);
		},
		onError(args) {
			console.log("onError callback:", args);
		},
		onNavigation(args) {
			console.log("onNavigation callback:", args);
		},
		onSettled(args) {
			console.log("onSettled callback:", args);
		},
		onExecute(args) {
			console.log("onExecute callback:", args);
		},
	});

	console.dir({
		result,
		status,
		isIdle,
		isExecuting,
		isTransitioning,
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
