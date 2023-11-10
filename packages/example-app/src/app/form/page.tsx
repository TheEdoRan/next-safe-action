import Link from "next/link";
import { signup } from "./signup-action";

export default function SignUpPage() {
	return (
		<>
			<Link href="/">Go to home</Link>
			<form action={signup}>
				<input type="text" name="email" placeholder="name@example.com" />
				<input type="password" name="password" placeholder="••••••••" />
				<button type="submit">Signup</button>
			</form>
		</>
	);
}
