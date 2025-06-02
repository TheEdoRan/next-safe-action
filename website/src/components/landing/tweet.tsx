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
			className="flex h-full min-w-[300px] flex-col space-y-3 rounded-xl border border-zinc-200 bg-white p-5 !no-underline transition hover:translate-y-[-2px] hover:shadow-md md:min-w-[320px] dark:border-zinc-700 dark:bg-zinc-800"
		>
			<div className="flex items-center space-x-3">
				<img
					src={`/img/x/${authorHandle}.jpg`}
					className="h-10 w-10 rounded-full border border-zinc-200 object-cover dark:border-zinc-700"
					alt={authorName}
				/>
				<div className="flex flex-col">
					<span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{authorName}</span>
					<span className="text-xs text-zinc-500 dark:text-zinc-400">@{authorHandle}</span>
				</div>
			</div>
			<div
				className="flex-1 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
				dangerouslySetInnerHTML={{ __html: textHTML }}
			/>
			<div className="text-xs text-zinc-500 dark:text-zinc-400">{date}</div>
		</a>
	);
}
