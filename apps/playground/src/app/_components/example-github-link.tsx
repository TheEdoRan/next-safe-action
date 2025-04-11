"use client";

import { Link } from "lucide-react";
import { usePathname } from "next/navigation";

type Props = {
	className?: string;
};

export function ExampleGithubLink({ className }: Props) {
	const pathname = usePathname();

	return (
		<a
			href={`https://github.com/TheEdoRan/next-safe-action/tree/main/apps/playground/src/app/(examples)${pathname}`}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="Example link to GitHub"
			className={className}
		>
			<Link className="w-4 h-4" />
			<span>View on GitHub</span>
		</a>
	);
}
