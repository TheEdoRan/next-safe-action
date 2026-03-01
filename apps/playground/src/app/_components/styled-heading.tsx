import type { ReactNode } from "react";

type Props = {
	children: ReactNode;
};

export function StyledHeading({ children }: Props) {
	return <h1 className="text-center text-2xl font-semibold">{children}</h1>;
}
