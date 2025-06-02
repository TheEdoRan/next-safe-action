"use client";

import { StyledButton } from "@/app/_components/styled-button";
import { StyledHeading } from "@/app/_components/styled-heading";
import { useAction } from "next-safe-action/hooks";
import { ResultBox } from "../../_components/result-box";
import { noargsAction } from "./noargs-action";

export default function EmptySchema() {
	const { execute, result, status, reset } = useAction(noargsAction);

	console.log("status:", status);

	return (
		<main className="w-96 max-w-full px-4">
			<StyledHeading>Action without arguments</StyledHeading>
			<form
				className="flex flex-col mt-8 space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					// Action call.
					execute();
				}}
			>
				<StyledButton type="submit">Execute action</StyledButton>
				<StyledButton type="button" onClick={reset}>
					Reset
				</StyledButton>
			</form>
			<ResultBox result={result} status={status} />
		</main>
	);
}
