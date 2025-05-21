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
			className="inline-flex cursor-pointer items-center justify-center gap-x-1 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-bold !text-zinc-800 !no-underline shadow-lg transition-transform hover:translate-y-[-2px] md:text-base"
		>
			<StarIcon className="size-4 md:size-5" />
			<span>{starsCount ? Intl.NumberFormat("en", { notation: "compact" }).format(starsCount) : "..."} GitHub</span>
		</a>
	);
}
