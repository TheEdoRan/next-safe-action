import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";
import { ExampleGithubLink } from "../_components/example-github-link";

export default function ExamplesLayout({ children }: { children: ReactNode }) {
	return (
		<div>
			<div className="flex items-center justify-center space-x-10">
				<Link href="/" className="flex items-center text-blue-600 hover:underline dark:text-blue-400">
					<ChevronLeft className="h-6 w-6" />
					<span className="text-lg font-semibold tracking-tight">Go back</span>
				</Link>
				<ExampleGithubLink className="flex items-center justify-center space-x-2 text-lg font-semibold text-blue-600 hover:underline dark:text-blue-400" />
			</div>
			<div className="mt-4">{children}</div>
		</div>
	);
}
