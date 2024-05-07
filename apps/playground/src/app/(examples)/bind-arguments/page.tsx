"use client";

import { StyledButton } from "@/app/_components/styled-button";
import { StyledHeading } from "@/app/_components/styled-heading";
import { StyledInput } from "@/app/_components/styled-input";
import { useAction } from "next-safe-action/hooks";
import { ResultBox } from "../../_components/result-box";
import { onboardUser } from "./onboard-action";

export default function BindArguments() {
	const boundOnboardUser = onboardUser.bind(
		null,
		crypto.randomUUID(),
		Math.floor(Math.random() * 200)
	);

	const { execute, result, status, reset } = useAction(boundOnboardUser, {
		onSuccess({ data, input }) {
			console.log("HELLO FROM ONSUCCESS", data, input);
		},
		onError({ error, input }) {
			console.log("OH NO FROM ONERROR", error, input);
		},
		onSettled({ result, input }) {
			console.log("HELLO FROM ONSETTLED", result, input);
		},
		onExecute({ input }) {
			console.log("HELLO FROM ONEXECUTE", input);
		},
	});

	console.log("status:", status);

	return (
		<main className="w-96 max-w-full px-4">
			<StyledHeading>Action binding arguments</StyledHeading>
			<form
				className="flex flex-col mt-8 space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const input = Object.fromEntries(formData) as {
						username: string;
					};

					// Action call.
					execute(input);
				}}>
				<StyledInput
					type="text"
					name="username"
					id="username"
					placeholder="Username"
				/>
				<StyledButton type="submit">Onboard user</StyledButton>
				<StyledButton type="button" onClick={reset}>
					Reset
				</StyledButton>
			</form>
			<ResultBox result={result} status={status} />
		</main>
	);
}
