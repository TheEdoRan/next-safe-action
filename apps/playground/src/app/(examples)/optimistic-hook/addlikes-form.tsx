"use client";

import { StyledButton } from "@/app/_components/styled-button";
import { StyledInput } from "@/app/_components/styled-input";
import { useOptimisticAction } from "next-safe-action/hooks";
import { ResultBox } from "../../_components/result-box";
import { addLikes } from "./addlikes-action";

type Props = {
	likesCount: number;
};

const AddLikesForm = ({ likesCount }: Props) => {
	// Here we pass safe action (`addLikes`) and current server state to `useAction` hook.
	const { execute, result, status, reset, optimisticResult } =
		useOptimisticAction(addLikes, {
			initResult: { data: { likesCount } },
			updateFn: ({ data: prevData }, { incrementBy }) => ({
				data: {
					likesCount: prevData.likesCount + incrementBy,
				},
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
					const input = Object.fromEntries(formData) as {
						incrementBy: string;
					};

					const intIncrementBy = parseInt(input.incrementBy);

					// Action call. Here we pass action input and expected (optimistic)
					// data.
					execute({ incrementBy: intIncrementBy });
				}}>
				<StyledInput
					type="text"
					name="incrementBy"
					id="incrementBy"
					placeholder="Increment by"
				/>
				<StyledButton type="submit">Add likes</StyledButton>
				<StyledButton type="button" onClick={reset}>
					Reset
				</StyledButton>
			</form>
			<ResultBox
				result={optimisticResult}
				status={status}
				customTitle="Optimistic data:"
			/>
		</>
	);
};

export default AddLikesForm;
