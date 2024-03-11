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
	const { execute, result, status, reset, optimisticData } =
		useOptimisticAction(
			addLikes,
			{ likesCount },
			({ likesCount }, { incrementBy }) => ({
				likesCount: likesCount + incrementBy,
			}),
			{
				onSuccess(data, input, reset) {
					console.log("HELLO FROM ONSUCCESS", data, input);

					// You can reset result object by calling `reset`.
					// reset();
				},
				onError(error, input, reset) {
					console.log("OH NO FROM ONERROR", error, input);

					// You can reset result object by calling `reset`.
					// reset();
				},
				onSettled(result, input, reset) {
					console.log("HELLO FROM ONSETTLED", result, input);

					// You can reset result object by calling `reset`.
					// reset();
				},
				onExecute(input) {
					console.log("HELLO FROM ONEXECUTE", input);
				},
			}
		);

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
				result={optimisticData}
				status={status}
				customTitle="Optimistic data:"
			/>
		</>
	);
};

export default AddLikesForm;
