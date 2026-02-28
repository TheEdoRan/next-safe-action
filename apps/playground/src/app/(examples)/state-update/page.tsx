"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { StyledButton } from "@/app/_components/styled-button";
import { StyledHeading } from "@/app/_components/styled-heading";
import { ResultBox } from "../../_components/result-box";
import { stateUpdateAction } from "./stateupdate-action";

export default function StateUpdate() {
	const [count, setCount] = useState(0);
	// Safe action (`deleteUser`) and optional callbacks passed to `useAction` hook.
	const { execute, result, status, reset } = useAction(stateUpdateAction, {
		onSuccess(args) {
			console.log("onSuccess callback:", args);
			console.log("Count value:", count);
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

	return (
		<main className="w-96 max-w-full px-4">
			<StyledHeading>State update</StyledHeading>
			<div className="mt-4 flex flex-col gap-2">
				<StyledButton type="button" onClick={() => setCount(count + 1)}>
					Increment
				</StyledButton>
				<StyledButton type="button" onClick={() => setCount(count - 1)}>
					Decrement
				</StyledButton>
				<StyledButton type="button" onClick={() => execute()}>
					Execute
				</StyledButton>
				<StyledButton type="button" onClick={reset}>
					Reset
				</StyledButton>
			</div>
			<p className="mt-4">Count value: {count}</p>
			<ResultBox result={result} status={status} />
		</main>
	);
}
