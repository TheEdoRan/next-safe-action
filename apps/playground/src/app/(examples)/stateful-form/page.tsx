"use client";

import { ResultBox } from "@/app/_components/result-box";
import { StyledButton } from "@/app/_components/styled-button";
import { StyledHeading } from "@/app/_components/styled-heading";
import { StyledInput } from "@/app/_components/styled-input";
import { useStateAction } from "next-safe-action/hooks";
import { statefulFormAction } from "./stateful-form-action";

export default function StatefulFormPage() {
	const { execute, result, status, input } = useStateAction(
		statefulFormAction,
		{
			initResult: { data: { newName: "jane" } }, // optionally pass initial state
		}
	);

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
