import { ComponentProps } from "react";

type Props = ComponentProps<"button">;

export function StyledButton(props: Props) {
	return (
		<button
			{...props}
			className={`${props.className ?? ""} bg-slate-950 text-slate-50 px-3 py-2 rounded-md w-full font-medium dark:bg-slate-50 dark:text-slate-950`}
		/>
	);
}
