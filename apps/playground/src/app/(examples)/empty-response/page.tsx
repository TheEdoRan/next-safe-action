"use client";

import { StyledButton } from "@/app/_components/styled-button";
import { StyledHeading } from "@/app/_components/styled-heading";
import { useAction } from "next-safe-action/hooks";
import { ResultBox } from "../../_components/result-box";
import { emptyAction } from "./empty-action";

export default function EmptyResponse() {
	const { execute, result, status, reset } = useAction(emptyAction);

	console.log("status:", status);

	return (
		<main className="w-96 max-w-full px-4">
			<StyledHeading>Action without response data</StyledHeading>
			<StyledButton
				type="button"
				className="mt-4"
				onClick={() => {
					execute({ userId: crypto.randomUUID() });
				}}>
				Execute action
			</StyledButton>
			<StyledButton className="mt-4" type="button" onClick={reset}>
				Reset
			</StyledButton>
			<ResultBox result={result} status={status} />
		</main>
	);
}
