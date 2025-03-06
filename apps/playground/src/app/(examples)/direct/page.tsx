"use client";

import { StyledButton } from "@/app/_components/styled-button";
import { StyledHeading } from "@/app/_components/styled-heading";
import { StyledInput } from "@/app/_components/styled-input";
import { useState } from "react";
import { ResultBox } from "../../_components/result-box";
import { loginUser } from "./login-action";

export default function DirectExamplePage() {
	const [result, setResult] = useState<any>(undefined);

	return (
		<main className="w-96 max-w-full px-4">
			<StyledHeading>Action using direct call</StyledHeading>
			<form
				className="flex flex-col mt-8 space-y-4"
				onSubmit={async (e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const input = Object.fromEntries(formData) as {
						username: string;
						password: string;
					};
					const res = await loginUser(input); // this is the typesafe action directly called
					setResult(res);
				}}
			>
				<StyledInput type="text" name="username" id="username" placeholder="Username" />
				<StyledInput type="password" name="password" id="password" placeholder="Password" />
				<StyledButton type="submit">Log in</StyledButton>
			</form>
			<ResultBox result={result} />
		</main>
	);
}
