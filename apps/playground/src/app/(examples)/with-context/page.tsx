"use client";

import { useAction } from "next-safe-action/hooks";
import { StyledButton } from "@/app/_components/styled-button";
import { StyledHeading } from "@/app/_components/styled-heading";
import { StyledInput } from "@/app/_components/styled-input";
import { ResultBox } from "../../_components/result-box";
import { editUser } from "./edituser-action";

export default function WithContextPage() {
	const { execute, result, status } = useAction(editUser);

	return (
		<main className="w-96 max-w-full px-4">
			<StyledHeading>Action with auth</StyledHeading>
			<form
				className="mt-8 flex flex-col space-y-4"
				onSubmit={async (e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const input = Object.fromEntries(formData) as {
						fullName: string;
						age: string;
					};
					execute(input);
				}}
			>
				<StyledInput type="text" name="fullName" id="fullName" placeholder="Full name" />
				<StyledInput type="text" name="age" id="age" placeholder="Age" />
				<StyledButton type="submit">Update profile</StyledButton>
			</form>
			<ResultBox result={result} status={status} />
		</main>
	);
}
