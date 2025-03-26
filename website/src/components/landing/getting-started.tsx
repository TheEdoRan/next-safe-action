export function GettingStarted() {
	return (
		<div className="flex min-h-screen items-center justify-center flex-col">
			<div className="text-xl sm:text-4xl lg:text-5xl tracking-tight font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-500 dark:from-cyan-300 dark:to-purple-300 sm:h-12 lg:h-16">
				Try it out for yourself!
			</div>
			<div className="flex gap-4 mt-10 flex-wrap items-center justify-center">
				<a
					href="/docs/getting-started"
					className="!no-underline hover:brightness-90 transition cursor-pointer rounded-lg py-2 font-bold inline-flex items-center justify-center text-2xl bg-zinc-800 !text-zinc-100 w-72"
				>
					Get started ➡️
				</a>
				<a
					href="https://next-safe-action-playground.vercel.app/"
					className="!no-underline hover:brightness-90 transition cursor-pointer rounded-lg py-2 font-bold inline-flex items-center justify-center text-2xl bg-orange-500 dark:bg-orange-600 !text-zinc-100 w-72"
				>
					Learn by example ✨
				</a>
			</div>
		</div>
	);
}
