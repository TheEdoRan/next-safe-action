import { forwardRef, type ComponentProps } from "react";

type Props = ComponentProps<"input">;

export const StyledInput = forwardRef<HTMLInputElement, Props>(function StyledInput(props: Props, ref) {
	return (
		<>
			<input
				{...props}
				ref={ref}
				className={`${props.className ?? ""} py-1 px-2 border rounded-md dark:bg-slate-800 dark:border-slate-700`}
			/>
		</>
	);
});

StyledInput.displayName = "StyledInput";
