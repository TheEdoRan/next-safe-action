import { ComponentProps } from "react";

type Props = ComponentProps<"input">;

export function StyledInput(props: Props) {
	return (
		<>
			<input
				{...props}
				className={`${props.className ?? ""} py-1 px-2 border rounded-md dark:bg-slate-800 dark:border-slate-700`}
			/>
		</>
	);
}
