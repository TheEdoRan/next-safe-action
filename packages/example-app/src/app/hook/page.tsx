import Link from "next/link";
import { getUserId } from "./db";
import { deleteUser } from "./deleteuser-action";
import DeleteUserForm from "./deleteuser-form";

export const metadata = {
	title: "Action using hook",
};

export default function Hook() {
	const userId = getUserId();

	return (
		<>
			<Link href="/">Go to home</Link>
			<h1>Action using hook</h1>
			{/* Pass the typesafe mutation to Client Component */}
			<DeleteUserForm userId={userId} deleteUser={deleteUser} />
		</>
	);
}
