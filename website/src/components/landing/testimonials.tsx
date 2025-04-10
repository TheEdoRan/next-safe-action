import { useEffect, useRef } from "react";
import { Tweet, TweetProps } from "./tweet";

const libURLSpan = `<span class="text-blue-500 dark:text-blue-400">https://github.com/TheEdoRan/next-safe-action</span>`;

const tweets: TweetProps[] = [
	{
		tweetURL: "https://x.com/Kingsley_codes/status/1718282007510143183",
		authorName: "Kingsley O.",
		authorHandle: "Kingsley_codes",
		date: "Oct 28, 2023",
		textHTML: `If you aren't using next-safe-actions by <b>@TheEdoRan</b> for your Next 14 app, what are you waiting for? The DX is marvelous. An even better package than zact and <b>@t3dotgg</b> recommends it too so you know it's good!`,
	},
	{
		tweetURL: "https://x.com/zaphodias/status/1654158096048979973",
		authorName: "zaphodias",
		authorHandle: "zaphodias",
		date: "May 4, 2023",
		textHTML: `step 1: upgrade to next 13.4;<br>
step 2: understand actions;<br>
step 3: use <b>@TheEdoRan</b>'s lib 🎉`,
	},
	{
		tweetURL: "https://x.com/rclmenezes/status/1654111420047409153",
		authorName: "rigo",
		authorHandle: "rclmenezes",
		date: "May 4, 2023",
		textHTML: `I predict that ${libURLSpan} is going to get a loooooot of stars in a few hours :)<br><br>
Props <b>@TheEdoRan</b>`,
	},
	{
		tweetURL: "https://x.com/ErfanEbrahimnia/status/1699816975009013935",
		authorName: "Erfan Ebrahimnia",
		authorHandle: "ErfanEbrahimnia",
		date: "Sep 7, 2023",
		textHTML: `Using next-safe-action by <b>@TheEdoRan</b> in a project right now and really like it<br><br>
It handles input-validation and errors when using Server Actions<br><br>
${libURLSpan}`,
	},
	{
		tweetURL: "https://x.com/Xexr/status/1674154036788879360",
		authorName: "Xexr",
		authorHandle: "Xexr",
		date: "Jun 28, 2023",
		textHTML: `<b>@t3dotgg</b> I saw you mention next-safe-action on your live stream. I wanted to throw my hat in the ring and give it a shout out.<br><br>
It's honestly great, <b>@TheEdoRan</b> has done a fantastic job and it deserves way more attention, I suspect it will get it after the stream mention. 👇`,
	},
];

export function Testimonials() {
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	// Clone tweets for the infinite scroll effect
	const allTweets = [...tweets, ...tweets];

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		// Reset scroll position when it gets too far
		const handleScroll = () => {
			if (container.scrollLeft > container.scrollWidth * 0.5) {
				// Reset without animation to create illusion of infinite scroll
				container.style.scrollBehavior = "auto";
				container.scrollLeft = 10;
				setTimeout(() => {
					container.style.scrollBehavior = "smooth";
				}, 50);
			}
		};

		container.addEventListener("scroll", handleScroll);

		// Start automatic scrolling animation
		let scrollInterval: NodeJS.Timeout;

		// Pause scrolling when hovering
		const startScrolling = () => {
			scrollInterval = setInterval(() => {
				if (container) {
					container.scrollBy({ left: 1, behavior: "auto" });
				}
			}, 30); // Adjust speed here - smaller number = faster scroll
		};

		const stopScrolling = () => {
			if (scrollInterval) {
				clearInterval(scrollInterval);
			}
		};

		container.addEventListener("mouseenter", stopScrolling);
		container.addEventListener("mouseleave", startScrolling);

		// Initial start
		startScrolling();

		return () => {
			container.removeEventListener("scroll", handleScroll);
			container.removeEventListener("mouseenter", stopScrolling);
			container.removeEventListener("mouseleave", startScrolling);
			clearInterval(scrollInterval);
		};
	}, []);

	return (
		<div className="bg-gradient-to-b from-zinc-100 to-zinc-50 py-20 md:py-24 lg:py-32 dark:from-zinc-950 dark:to-zinc-950">
			<div className="px-5 md:px-10">
				<div className="mx-auto w-full max-w-7xl">
					<div className="mb-10 text-center md:mb-16">
						<h2 className="mb-4 text-2xl font-bold md:text-3xl lg:text-4xl">What developers are saying</h2>
						<p className="mx-auto max-w-2xl text-zinc-600 dark:text-zinc-400">
							Join thousands of developers who are already using next-safe-action in their projects
						</p>
					</div>

					<div className="relative overflow-hidden">
						{/* Left fade overlay */}
						<div className="absolute bottom-0 left-0 top-0 z-10 w-16 bg-gradient-to-r from-white to-transparent md:w-24 dark:from-zinc-950 dark:to-transparent"></div>

						{/* Right fade overlay */}
						<div className="absolute bottom-0 right-0 top-0 z-10 w-16 bg-gradient-to-l from-white to-transparent md:w-24 dark:from-zinc-950 dark:to-transparent"></div>

						<div
							ref={scrollContainerRef}
							className="no-scrollbar flex gap-6 overflow-x-auto pb-4"
							style={{
								scrollbarWidth: "none",
								msOverflowStyle: "none",
							}}
						>
							{allTweets.map((tweet, idx) => (
								<div key={idx} className="w-[300px] flex-shrink-0 md:w-[320px]">
									<Tweet {...tweet} />
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
