import Autoscroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";
import { Tweet, TweetProps } from "./tweet";

const libURLSpan = `<span class="text-blue-500 dark:text-blue-400">https://github.com/TheEdoRan/next-safe-action</span>`;

const tweets: TweetProps[] = [
	{
		tweetURL: "https://x.com/pontusab/status/1812900765444546823",
		authorName: "Pontus Abrahamsson — oss/acc",
		authorHandle: "pontusab",
		date: "Jul 15, 2024",
		textHTML: `If you're using 
<b>@nextjs</b>
 server actions, I highly recommend next-safe-action library from 
<b>@TheEdoRan</b>. In this example, we have:<br>
* <b>@supabase</b> client in context ⚡<br>
* Auth middleware 🔐<br>
* Analytics middleware to OpenPanel 👀<br>
* Support for optimistic updates`,
	},
	{
		tweetURL: "https://x.com/yesdavidgray/status/1864328225158996141",
		authorName: "Dave Gray ☕💻🌮",
		authorHandle: "yesdavidgray",
		date: "Dec 4, 2024",
		textHTML: `My Next.js 15 Project series rolls on with Chapter 8! 🎉 In this video, I show how next-safe-action (<b>@TheEdoRan</b>) and Sentry (<b>@getsentry</b>) are the perfect combo for server actions 💯`,
	},
	{
		tweetURL: "https://x.com/Lermatroid/status/1836605056650478074",
		authorName: "Liam Murray",
		authorHandle: "Lermatroid",
		date: "Sep 19, 2024",
		textHTML: `This is my monthly "try next-safe-action" post.<br>It will blow your mind how easy it is to setup a e2e typesafe api in next.`,
	},
	{
		tweetURL: "https://x.com/Kingsley_codes/status/1718282007510143183",
		authorName: "Kingsley O.",
		authorHandle: "Kingsley_codes",
		date: "Oct 28, 2023",
		textHTML: `If you aren't using next-safe-actions by <b>@TheEdoRan</b> for your Next 14 app, what are you waiting for? The DX is marvelous. An even better package than zact and <b>@t3dotgg</b> recommends it too so you know it's good!`,
	},
	{
		tweetURL: "https://x.com/nikelsnik/status/1833845745998250393",
		authorName: "Nik Elsnik",
		authorHandle: "nikelsnik",
		date: "Sep 11, 2024",
		textHTML: `My go-to method for handling forms in <b>@nextjs</b><br>
* react-hook-form -> form handling 📋<br>
* zod -> validation ✅<br>
* shadcn/ui -> UI components 🧱<br>
* next-safe-action -> server actions ☁️<br>
* sonner -> success/error toast messages 🍞`,
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
		tweetURL: "https://x.com/1weiho/status/1870423791979167799",
		authorName: "Yiwei Ho",
		authorHandle: "1weiho",
		date: "Dec 21, 2024",
		textHTML: `Recently, my favorite package to use with Next.js is next-safe-action, which allows you to wrap all server actions with a custom action client that can define effects similar to middleware for server actions using a pipeline pattern, such as authentication and rate limiting.`,
	},
	{
		tweetURL: "https://x.com/pontusab/status/1823999228122972614",
		authorName: "Pontus Abrahamsson — oss/acc",
		authorHandle: "pontusab",
		date: "Aug 15, 2024",
		textHTML: `The best way to handle forms in <b>@nextjs</b>, from client to database:<br>
* Shadcn - UI components 💅<br>
* React Hook Form - form handling 💼<br>
* zod - validation 🔍<br>
* next-safe-action - server actions 🧱<br>
`,
	},
	{
		tweetURL: "https://x.com/Xexr/status/1674154036788879360",
		authorName: "Xexr",
		authorHandle: "Xexr",
		date: "Jun 28, 2023",
		textHTML: `<b>@t3dotgg</b> I saw you mention next-safe-action on your live stream. I wanted to throw my hat in the ring and give it a shout out.<br><br>
It's honestly great, <b>@TheEdoRan</b> has done a fantastic job and it deserves way more attention, I suspect it will get it after the stream mention. 👇`,
	},
	{
		tweetURL: "https://x.com/CasterKno/status/1804780098320552304",
		authorName: "Caster",
		authorHandle: "CasterKno",
		date: "Jun 23, 2024",
		textHTML: `I recently came across a library called next-safe-action, which I'm impressed with. I'll definitely be using it in my next project.`,
	},
	{
		tweetURL: "https://x.com/muratsutunc/status/1868235838724923767",
		authorName: "Murat Sutunc",
		authorHandle: "muratsutunc",
		date: "Dec 15, 2024",
		textHTML: `next-safe-action is highly recommended`,
	},
	{
		tweetURL: "https://x.com/Rajdeep__ds/status/1874329087302668652",
		authorName: "Rajdeep",
		authorHandle: "Rajdeep__ds",
		date: "Jan 1, 2025",
		textHTML: `Just tried <b>@TheEdoRan</b>'s next-safe-action with <b>@nextjs</b> 15 Server Actions—it's a game-changer! 🚀<br>
Type-safe server actions + seamless DX = 🔥<br>
Highly recommend checking it out! 🤩`,
	},
];

export function Testimonials() {
	const [emblaRef] = useEmblaCarousel({ watchDrag: false, loop: true }, [Autoscroll({ speed: 0.5, playOnInit: true })]);

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

						<div className="embla" ref={emblaRef}>
							<div className="embla__container">
								{tweets.map((tweet, index) => (
									<div className="embla__slide" key={tweet.tweetURL}>
										<Tweet {...tweet} />
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
