import Link from "next/link";
import EditUserForm from "./edituser-form";

export const metadata = {
	title: "Action with auth",
};

export default function WithAuth() {
	return (
		<>
			<Link href="/">Go to home</Link>
			<h1>Action with auth</h1>
			<EditUserForm />
		</>
	);
}
