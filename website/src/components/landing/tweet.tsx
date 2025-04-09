export type TweetProps = {
	tweetURL: string;
	authorName: string;
	authorHandle: string;
	date: string;
	textHTML: string;
};

export function Tweet({ tweetURL, authorName, authorHandle, date, textHTML }: TweetProps) {
	return (
		<a
			href={tweetURL}
			target="_blank"
			rel="noopener noreferrer"
			className="p-5 bg-white dark:bg-zinc-800 rounded-xl flex flex-col space-y-3 !no-underline transition hover:shadow-md hover:translate-y-[-2px] border border-zinc-200 dark:border-zinc-700 min-w-[300px] md:min-w-[320px] h-full"
		>
			<div className="flex space-x-3 items-center">
				<img
					src={`/img/x/${authorHandle}.jpg`}
					className="rounded-full w-10 h-10 object-cover border border-zinc-200 dark:border-zinc-700"
					alt={authorName}
				/>
				<div className="flex flex-col">
					<span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{authorName}</span>
					<span className="text-xs text-zinc-500 dark:text-zinc-400">@{authorHandle}</span>
				</div>
			</div>
			<div
				className="text-zinc-800 dark:text-zinc-200 flex-1 text-sm leading-relaxed"
				dangerouslySetInnerHTML={{ __html: textHTML }}
			/>
			<div className="text-xs text-zinc-500 dark:text-zinc-400">{date}</div>
		</a>
	);
}
