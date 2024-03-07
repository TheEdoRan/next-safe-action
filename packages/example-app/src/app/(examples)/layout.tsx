import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

export default function ExamplesLayout({ children }: { children: ReactNode }) {
	return (
		<div>
			<Link
				href="/"
				className="text-center flex items-center justify-center text-blue-600 dark:text-blue-400 hover:underline w-fit mx-auto">
				<ChevronLeft className="w-6 h-6" />
				<span className="text-lg font-semibold tracking-tight">Go back</span>
			</Link>
			<div className="mt-4">{children}</div>
		</div>
	);
}
