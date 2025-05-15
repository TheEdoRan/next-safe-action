"use client";

import { StyledButton } from "@/app/_components/styled-button";
import { StyledHeading } from "@/app/_components/styled-heading";
import { StyledInput } from "@/app/_components/styled-input";
import { useAction } from "next-safe-action/hooks";
import { ResultBox } from "../../_components/result-box";
import { deleteUser } from "./deleteuser-action";

export default function Hook() {
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
	} = useAction(deleteUser, {
		onSuccess(args) {
			console.log("HELLO FROM ONSUCCESS", args);
		},
		onError(args) {
			console.log("OH NO FROM ONERROR", args);
		},
		onNavigation(args) {
			console.log("OH NO FROM ONNAVIGATION", args);
		},
		onSettled(args) {
			console.log("HELLO FROM ONSETTLED", args);
		},
		onExecute(args) {
			console.log("HELLO FROM ONEXECUTE", args);
		},
	});

	console.dir({
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
			<form
				className="mt-8 flex flex-col space-y-4"
				onSubmit={async (e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const input = Object.fromEntries(formData) as {
						userId: string;
					};

					// Action call. Here we use `executeAsync` that lets us await the result. You can also use the `execute` function,
					// which is synchronous.
					const r = await executeAsync(input);
					console.log("r", r);
				}}
			>
				<StyledInput type="text" name="userId" id="userId" placeholder="User ID" />
				<StyledButton type="submit">Delete user</StyledButton>
				<StyledButton type="button" onClick={reset}>
					Reset
				</StyledButton>
			</form>
			<ResultBox result={result} status={status} />
		</main>
	);
}
