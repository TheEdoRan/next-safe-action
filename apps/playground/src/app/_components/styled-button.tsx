import { forwardRef, type ComponentProps } from "react";

type Props = ComponentProps<"button">;

export const StyledButton = forwardRef<HTMLButtonElement, Props>(function StyledButton(props: Props, ref) {
	return (
		<button
			{...props}
			ref={ref}
			className={`${props.className ?? ""} bg-slate-950 text-slate-50 px-3 py-2 rounded-md w-full font-medium dark:bg-slate-50 dark:text-slate-950`}
		/>
	);
});

StyledButton.displayName = "StyledButton";
