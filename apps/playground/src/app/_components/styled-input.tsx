import { forwardRef, type ComponentProps } from "react";

type Props = ComponentProps<"input">;

export const StyledInput = forwardRef<HTMLInputElement, Props>(function StyledInput(props: Props, ref) {
	return (
		<>
			<input
				{...props}
				ref={ref}
				className={`${props.className ?? ""} rounded-md border px-2 py-1 dark:border-slate-700 dark:bg-slate-800`}
			/>
		</>
	);
});

StyledInput.displayName = "StyledInput";
