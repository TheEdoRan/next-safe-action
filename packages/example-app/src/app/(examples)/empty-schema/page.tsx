"use client";

import { StyledButton } from "@/app/_components/styled-button";
import { StyledHeading } from "@/app/_components/styled-heading";
import { useAction } from "next-safe-action/hooks";
import { ResultBox } from "../../_components/result-box";
import { emptyAction } from "./empty-action";

export default function EmptySchema() {
	const { execute, result, status, reset } = useAction(emptyAction, {
		onSuccess({ data, input, reset }) {
			console.log("HELLO FROM ONSUCCESS", data, input);

			// You can reset result object by calling `reset`.
			// reset();
		},
		onError({ error, input, reset }) {
			console.log("OH NO FROM ONERROR", error, input);

			// You can reset result object by calling `reset`.
			// reset();
		},
		onSettled({ result, input, reset }) {
			console.log("HELLO FROM ONSETTLED", result, input);

			// You can reset result object by calling `reset`.
			// reset();
		},
		onExecute({ input }) {
			console.log("HELLO FROM ONEXECUTE", input);
		},
	});

	console.log("status:", status);

	return (
		<main className="w-96 max-w-full px-4">
			<StyledHeading>Action without schema</StyledHeading>
			<form
				className="flex flex-col mt-8 space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);

					// Action call.
					execute();
				}}>
				<StyledButton type="submit">Execute action</StyledButton>
				<StyledButton type="button" onClick={reset}>
					Reset
				</StyledButton>
			</form>
			<ResultBox result={result} status={status} />
		</main>
	);
}
