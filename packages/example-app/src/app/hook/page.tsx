import Link from "next/link";
import { getUserId } from "./deleteuser-action";
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
			{/* Pass the user id from server to Client Component */}
			<DeleteUserForm userId={userId} />
		</>
	);
}
