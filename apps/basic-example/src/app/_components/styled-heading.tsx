import { ReactNode } from "react";

type Props = {
	children: ReactNode;
};

export function StyledHeading({ children }: Props) {
	return <h1 className="text-2xl font-semibold text-center">{children}</h1>;
}
