import { forwardRef, type ComponentProps } from "react";

type Props = ComponentProps<"button">;

export const StyledButton = forwardRef<HTMLButtonElement, Props>(function StyledButton(props: Props, ref) {
	return (
		<button
			{...props}
			ref={ref}
			className={`${props.className ?? ""} w-full rounded-md bg-slate-950 px-3 py-2 font-medium text-slate-50 dark:bg-slate-50 dark:text-slate-950`}
		/>
	);
});

StyledButton.displayName = "StyledButton";
