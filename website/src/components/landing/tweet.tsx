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
			className="p-4 bg-white dark:bg-zinc-800 rounded-xl flex flex-col space-y-4 max-w-lg !no-underline transition hover:brightness-90"
		>
			<div className="flex space-x-4 items-center">
				<img src={`/img/x/${authorHandle}.jpg`} className="rounded-full w-10 h-10" />
				<div className="flex flex-col">
					<span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{authorName}</span>
					<span className="text-sm text-zinc-600 dark:text-zinc-400">@{authorHandle}</span>
				</div>
			</div>
			<div className="text-zinc-950 dark:text-zinc-50 flex-1" dangerouslySetInnerHTML={{ __html: textHTML }} />
			<div className="text-sm text-zinc-600 dark:text-zinc-400 ">{date}</div>
		</a>
	);
}
