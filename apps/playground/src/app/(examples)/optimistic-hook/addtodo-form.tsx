"use client";

import { StyledButton } from "@/app/_components/styled-button";
import { StyledInput } from "@/app/_components/styled-input";
import { useOptimisticAction } from "next-safe-action/hooks";
import { ResultBox } from "../../_components/result-box";
import { Todo, addTodo } from "./addtodo-action";

type Props = {
	todos: Todo[];
};

const AddTodoForm = ({ todos }: Props) => {
	// Here we pass safe action (`addTodo`) and current server data to `useOptimisticAction` hook.
	const { execute, result, status, reset, optimisticState } =
		useOptimisticAction(addTodo, {
			currentState: { todos },
			updateFn: (state, newTodo) => ({
				todos: [...state.todos, newTodo],
			}),
			onSuccess({ data, input }) {
				console.log("HELLO FROM ONSUCCESS", data, input);
			},
			onError({ error, input }) {
				console.log("OH NO FROM ONERROR", error, input);
			},
			onSettled({ result, input }) {
				console.log("HELLO FROM ONSETTLED", result, input);
			},
			onExecute({ input }) {
				console.log("HELLO FROM ONEXECUTE", input);
			},
		});

	console.log("status:", status);

	return (
		<>
			<form
				className="flex flex-col mt-8 space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const body = formData.get("body") as string;

					// Action call. Here we pass action input and expected (optimistic)
					// data.
					execute({ id: crypto.randomUUID(), body, completed: false });
				}}>
				<StyledInput type="text" name="body" placeholder="Todo body" />
				<StyledButton type="submit">Add todo</StyledButton>
				<StyledButton type="button" onClick={reset}>
					Reset
				</StyledButton>
			</form>
			<ResultBox
				result={optimisticState}
				status={status}
				customTitle="Optimistic data:"
			/>
		</>
	);
};

export default AddTodoForm;
