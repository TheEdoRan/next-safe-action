import { Tweet, TweetProps } from "./tweet";

const libURLSpan = `<span class="text-blue-500 dark:text-blue-400">https://github.com/TheEdoRan/next-safe-action</span>`;

const tweets: TweetProps[] = [
	{
		tweetURL: "https://twitter.com/dihmeetree/status/1734512058597605854",
		authorName: "Dmitry",
		authorHandle: "dihmeetree",
		date: "Dec 12, 2023",
		textHTML: `Thank you <b>@TheEdoRan</b> for the "next-safe-action" package! It's super awesome!! Keep up the amazing work! 😊`,
	},
	{
		tweetURL: "https://twitter.com/Kingsley_codes/status/1718282007510143183",
		authorName: "Kingsley O.",
		authorHandle: "Kingsley_codes",
		date: "Oct 28, 2023",
		textHTML: `If you aren't using next-safe-actions by <b>@TheEdoRan</b> for your Next 14 app, what are you waiting for? The DX is marvelous. An even better package than zact and <b>@t3dotgg</b> recommends it too so you know it's good!`,
	},
	{
		tweetURL: "https://twitter.com/zaphodias/status/1654158096048979973",
		authorName: "zaphodias",
		authorHandle: "zaphodias",
		date: "May 4, 2023",
		textHTML: `step 1: upgrade to next 13.4;<br>
step 2: understand actions;<br>
step 3: use <b>@TheEdoRan</b>'s lib 🎉`,
	},
	{
		tweetURL: "https://twitter.com/rclmenezes/status/1654111420047409153",
		authorName: "rigo",
		authorHandle: "rclmenezes",
		date: "May 4, 2023",
		textHTML: `I predict that ${libURLSpan} is going to get a loooooot of stars in a few hours :)<br><br>
Props <b>@TheEdoRan</b>`,
	},
	{
		tweetURL: "https://twitter.com/ErfanEbrahimnia/status/1699816975009013935",
		authorName: "Erfan Ebrahimnia",
		authorHandle: "ErfanEbrahimnia",
		date: "Sep 7, 2023",
		textHTML: `Using next-safe-action by <b>@TheEdoRan</b> in a project right now and really like it<br><br>
It handles input-validation and errors when using Server Actions<br><br>
${libURLSpan}`,
	},
	{
		tweetURL: "https://twitter.com/Xexr/status/1674154036788879360",
		authorName: "Xexr",
		authorHandle: "Xexr",
		date: "Jun 28, 2023",
		textHTML: `<b>@t3dotgg</b> I saw you mention next-safe-action on your live stream. I wanted to throw my hat in the ring and give it a shout out.<br><br>
It's honestly great, <b>@TheEdoRan</b> has done a fantastic job and it deserves way more attention, I suspect it will get it after the stream mention. 👇`,
	},
];

export function Testimonials() {
	return (
		<div className="px-5 md:px-10">
			<div className="mx-auto w-full max-w-6xl">
				<div className="flex-col flex gap-y-20 max-[479px]:gap-[60px] items-center lg:items-center py-20 lg:py-24">
					<div className="flex-col flex items-center justify-center gap-y-[60px] max-[479px]:gap-[60px]">
						<div className="text-center font-bold text-3xl sm:text-4xl lg:text-5xl">Coolest web devs say:</div>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
							{tweets.map((tweet, idx) => (
								<Tweet key={idx} {...tweet} />
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
