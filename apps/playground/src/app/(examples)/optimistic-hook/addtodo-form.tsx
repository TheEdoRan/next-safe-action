"use client";

import { useOptimisticAction } from "next-safe-action/hooks";
import { StyledButton } from "@/app/_components/styled-button";
import { StyledInput } from "@/app/_components/styled-input";
import { ResultBox } from "../../_components/result-box";
import type { Todo } from "./addtodo-action";
import { addTodo } from "./addtodo-action";

type Props = {
	todos: Todo[];
};

const AddTodoForm = ({ todos }: Props) => {
	// Here we pass safe action (`addTodo`) and current server data to `useOptimisticAction` hook.
	const { execute, status, reset, optimisticState } = useOptimisticAction(addTodo, {
		currentState: { todos },
		updateFn: (state, newTodo) => ({
			todos: [...state.todos, newTodo],
		}),
		onSuccess(args) {
			console.log("onSuccess callback:", args);
		},
		onError(args) {
			console.log("onError callback:", args);
		},
		onNavigation(args) {
			console.log("onNavigation callback:", args);
		},
		onSettled(args) {
			console.log("onSettled callback:", args);
		},
		onExecute(args) {
			console.log("onExecute callback:", args);
		},
	});

	console.log("status:", status);

	return (
		<>
			<form
				className="mt-8 flex flex-col space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const body = formData.get("body") as string;

					// Action call. Here we pass action input and expected (optimistic)
					// data.
					execute({ id: crypto.randomUUID(), body, completed: false });
				}}
			>
				<StyledInput type="text" name="body" placeholder="Todo body" />
				<StyledButton type="submit">Add todo</StyledButton>
				<StyledButton type="button" onClick={reset}>
					Reset
				</StyledButton>
			</form>
			<ResultBox result={optimisticState} status={status} customTitle="Optimistic data:" />
		</>
	);
};

export default AddTodoForm;
