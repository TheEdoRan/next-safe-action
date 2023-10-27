import React from "react";

export type TweetProps = {
	tweetURL: string;
	authorName: string;
	authorHandle: string;
	authorImage: string;
	date: string;
	textHTML: string;
};

export function Tweet({
	tweetURL,
	authorName,
	authorHandle,
	authorImage,
	date,
	textHTML,
}: TweetProps) {
	return (
		<a
			href={tweetURL}
			target="_blank"
			rel="noopener noreferrer"
			className="p-4 bg-white dark:bg-stone-800 rounded-xl flex flex-col space-y-4 max-w-lg !no-underline transition hover:brightness-90">
			<div className="flex space-x-4 items-center">
				<img src={authorImage} className="rounded-full w-10 h-10" />
				<div className="flex flex-col">
					<span className="text-sm font-semibold text-stone-950 dark:text-stone-50">
						{authorName}
					</span>
					<span className="text-sm text-stone-600 dark:text-stone-400">
						@{authorHandle}
					</span>
				</div>
			</div>
			<div
				className="text-stone-950 dark:text-stone-50 flex-1"
				dangerouslySetInnerHTML={{ __html: textHTML }}
			/>
			<div className="text-sm text-stone-600 dark:text-stone-400 ">{date}</div>
		</a>
	);
}
