import { StyledHeading } from "@/app/_components/styled-heading";
import { getTodos } from "./addtodo-action";
import AddTodoForm from "./addtodo-form";

export default async function OptimisticHookPage() {
	const todos = await getTodos();

	return (
		<main className="w-96 max-w-full px-4">
			<StyledHeading>Action using optimistic hook</StyledHeading>
			{/* Pass the server state to Client Component */}
			<AddTodoForm todos={todos} />
		</main>
	);
}
