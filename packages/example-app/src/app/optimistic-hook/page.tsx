import Link from "next/link";
import { getLikes } from "./addlikes-action";
import AddLikeForm from "./addlikes-form";

export const metadata = {
	title: "Action using optimistic hook",
};

export default function OptimisticHook() {
	const likesCount = getLikes();
	return (
		<>
			<Link href="/">Go to home</Link>
			<h1>Action using optimistic hook</h1>
			<pre style={{ marginTop: "1rem" }}>
				Server state: {JSON.stringify(likesCount)}
			</pre>
			{/* Pass the server state to Client Component */}
			<AddLikeForm likesCount={likesCount} />
		</>
	);
}
