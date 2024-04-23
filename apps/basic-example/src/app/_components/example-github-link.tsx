"use client";

import { Link } from "lucide-react";
import { usePathname } from "next/navigation";

type Props = {
	className?: string;
};

export function ExampleGithubLink({ className }: Props) {
	const pathname = usePathname();

	console.log(pathname);

	return (
		<a
			href={`https://github.com/TheEdoRan/next-safe-action/tree/main/apps/basic-example/src/app/(examples)${pathname}`}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="Example link to GitHub"
			className={className}>
			<span>View on GitHub</span>
			<Link className="w-4 h-4" />
		</a>
	);
}
