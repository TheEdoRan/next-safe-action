"use client";

import { ResultBox } from "@/app/_components/result-box";
import { StyledButton } from "@/app/_components/styled-button";
import { StyledHeading } from "@/app/_components/styled-heading";
import { StyledInput } from "@/app/_components/styled-input";
import { useActionState } from "react";
import { statefulFormAction } from "./stateful-form-action";

export default function StatefulFormPage() {
	const [state, action, isPending] = useActionState(statefulFormAction, {
		data: { newName: "jane" }, // optionally pass initial state
	});

	return (
		<main className="w-96 max-w-full px-4">
			<StyledHeading>
				Stateful form action using <pre>useActionState()</pre>
			</StyledHeading>
			<form action={action} className="flex flex-col mt-8 space-y-4">
				<StyledInput type="text" name="name" placeholder="Name" />
				<StyledButton type="submit">Submit</StyledButton>
			</form>
			<p className="text-lg font-semibold">
				<code>isPending</code>: {JSON.stringify(isPending)}
			</p>
			<ResultBox result={state} />
		</main>
	);
}
