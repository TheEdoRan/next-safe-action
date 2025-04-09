import { StarIcon } from "lucide-react";
import { useEffect, useState } from "react";

function useFetchStarsCount() {
	const [starsCount, setStarsCount] = useState<number | null>(undefined);

	useEffect(() => {
		fetch("https://api.github.com/repos/TheEdoRan/next-safe-action")
			.then((res) =>
				res.json().then((data) => {
					if (typeof data.stargazers_count === "number") {
						setStarsCount(data.stargazers_count);
					}
				})
			)
			.catch(console.error);
	}, []);

	return { starsCount };
}

export function GitHubButton() {
	const { starsCount } = useFetchStarsCount();

	return (
		<a
			href="https://github.com/TheEdoRan/next-safe-action"
			target="_blank"
			rel="noopener noreferrer"
			className="!no-underline hover:translate-y-[-2px] transition-transform border border-zinc-700 dark:border-zinc-300 text-zinc-200 dark:text-zinc-800 cursor-pointer rounded-lg bg-zinc-800 dark:bg-zinc-200 px-4 py-2 md:px-5 md:py-3 font-bold inline-flex items-center justify-center gap-x-1 text-sm md:text-base"
		>
			<StarIcon className="size-4 md:size-5" />
			<span>{starsCount ? Intl.NumberFormat("en", { notation: "compact" }).format(starsCount) : "..."} GitHub</span>
		</a>
	);
}
