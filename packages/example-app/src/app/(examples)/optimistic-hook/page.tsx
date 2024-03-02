import { StyledHeading } from "@/app/_components/styled-heading";
import { getLikes } from "./addlikes-action";
import AddLikeForm from "./addlikes-form";

export default function OptimisticHook() {
	const likesCount = getLikes();
	return (
		<main className="w-96 max-w-full px-4">
			<StyledHeading>Action using optimistic hook</StyledHeading>
			<pre className="mt-4 text-center">
				Server state: {JSON.stringify(likesCount)}
			</pre>
			{/* Pass the server state to Client Component */}
			<AddLikeForm likesCount={likesCount} />
		</main>
	);
}
