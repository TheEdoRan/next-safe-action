import Link from "next/link";
import LoginForm from "./login-form";

export const metadata = {
	title: "Action without auth",
};

export default function Home() {
	return (
		<>
			<Link href="/with-context">Go to /with-context</Link>
			<Link href="/hook">Go to /hook</Link>
			<Link href="/optimistic-hook">Go to /optimistic-hook</Link>
			<Link href="/form">Go to /form</Link>
			<Link href="/nested-schema">Go to /nested-schema</Link>
			<h1>Action without auth</h1>
			<LoginForm />
		</>
	);
}
