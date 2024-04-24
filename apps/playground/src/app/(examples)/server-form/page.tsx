import { StyledButton } from "@/app/_components/styled-button";
import { StyledHeading } from "@/app/_components/styled-heading";
import { StyledInput } from "@/app/_components/styled-input";
import { signup } from "./signup-action";

export default function SignUpPage() {
	return (
		<main className="w-96 max-w-full px-4">
			<StyledHeading>Action using server form</StyledHeading>
			<form action={signup} className="flex flex-col mt-8 space-y-4">
				<StyledInput type="text" name="email" placeholder="name@example.com" />
				<StyledInput type="password" name="password" placeholder="••••••••" />
				<StyledButton type="submit">Signup</StyledButton>
			</form>
		</main>
	);
}
