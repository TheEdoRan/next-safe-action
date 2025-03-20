"use client";

import { ResultBox } from "@/app/_components/result-box";
import { StyledButton } from "@/app/_components/styled-button";
import { StyledHeading } from "@/app/_components/styled-heading";
import { StyledInput } from "@/app/_components/styled-input";
import { useAction } from "next-safe-action/hooks";
import { fileUploadAction } from "./file-upload-action";

export default function FileUploadPage() {
	const { execute, result, status, input } = useAction(fileUploadAction);

	console.log("INPUT ->", input);
	console.log("RESULT ->", result);

	return (
		<main className="w-96 max-w-full px-4">
			<StyledHeading>File upload action</StyledHeading>
			<form action={execute} className="flex flex-col mt-8 space-y-4">
				<StyledInput type="file" name="image" placeholder="Image" accept="image/*" />
				<StyledButton type="submit">Submit</StyledButton>
			</form>
			<ResultBox result={result} status={status} />
		</main>
	);
}
