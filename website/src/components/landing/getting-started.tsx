export function GettingStarted() {
	return (
		<div className="flex min-h-screen items-center justify-center flex-col">
			<div className="text-xl sm:text-4xl lg:text-5xl tracking-tight font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 dark:from-orange-300 dark:to-amber-300 sm:h-12 lg:h-16">
				It's time to try it out for yourself!
			</div>
			<div className="flex gap-4 mt-10 flex-wrap items-center justify-center">
				<a
					href="/docs/getting-started"
					className="!no-underline hover:brightness-90 transition cursor-pointer rounded-lg mr-4 px-3 py-2 font-bold inline-flex items-center justify-center text-2xl bg-zinc-800 !text-zinc-100 dark:bg-zinc-100 dark:!text-zinc-900 w-64">
					Getting started 🎉
				</a>
				<a
					href="/docs/examples/basic-implementation"
					className="!no-underline hover:brightness-90 transition cursor-pointer rounded-lg mr-4 px-3 py-2 font-bold inline-flex items-center justify-center text-2xl bg-[#ffa024] !text-zinc-100 w-64">
					Explore example ➡️
				</a>
			</div>
		</div>
	);
}
