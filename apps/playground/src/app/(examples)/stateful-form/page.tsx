"use client";

import { ResultBox } from "@/app/_components/result-box";
import { StyledButton } from "@/app/_components/styled-button";
import { StyledHeading } from "@/app/_components/styled-heading";
import { StyledInput } from "@/app/_components/styled-input";
import { useStateAction } from "next-safe-action/hooks";
import { statefulAction } from "./stateful-action";

export default function StatefulFormPage() {
	const { execute, result, status } = useStateAction(statefulAction, {
		initResult: { data: { newName: "jane" } }, // optionally pass initial state
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

	return (
		<main className="w-96 max-w-full px-4">
			<StyledHeading>
				Stateful form action using <pre>useStateAction()</pre>
			</StyledHeading>
			<form action={execute} className="flex flex-col mt-8 space-y-4">
				<StyledInput type="text" name="name" placeholder="Name" />
				<StyledButton type="submit">Submit</StyledButton>
			</form>
			<ResultBox result={result} status={status} />
		</main>
	);
}
