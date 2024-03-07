"use client";

import { ResultBox } from "@/app/_components/result-box";
import { StyledButton } from "@/app/_components/styled-button";
import { StyledHeading } from "@/app/_components/styled-heading";
import { StyledInput } from "@/app/_components/styled-input";
import { useFormState } from "react-dom";
import { signupAction } from "./signup-action";

// Temporary implementation.
export default function SignUpPage() {
	const [state, action] = useFormState(signupAction, {
		message: "Click on the signup button to see the result.",
	});

	return (
		<main className="w-96 max-w-full px-4">
			<StyledHeading>Action using client form</StyledHeading>
			<form action={action} className="flex flex-col mt-8 space-y-4">
				<StyledInput type="text" name="email" placeholder="name@example.com" />
				<StyledInput type="password" name="password" placeholder="••••••••" />
				<StyledButton type="submit">Signup</StyledButton>
			</form>
			<ResultBox result={state} />
		</main>
	);
}
