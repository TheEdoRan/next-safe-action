import { Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

type Props = {
	href: string;
	children: ReactNode;
};

export function ExampleLink({ href, children }: Props) {
	return (
		<Link href={href} className="text-lg">
			<span className="flex items-center justify-center space-x-2 hover:underline">
				<LinkIcon className="w-4 h-4" />
				<span>{children}</span>
			</span>
		</Link>
	);
}
