export function GettingStarted() {
	return (
		<div className="py-24 md:py-32 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950">
			<div className="px-5 md:px-10">
				<div className="mx-auto w-full max-w-4xl text-center">
					<h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 inline-block">
						Ready to get started?
					</h2>
					<p className="text-zinc-600 dark:text-zinc-400 mb-12 max-w-xl mx-auto">
						Explore the documentation to learn how to use next-safe-action in your Next.js projects. Whether you're a
						beginner or already experienced with it, we've got you covered with comprehensive guides and examples.
					</p>
					<div className="flex flex-wrap gap-4 items-center justify-center">
						<a
							href="/docs/getting-started"
							className="!no-underline hover:translate-y-[-2px] transition-all hover:shadow-lg cursor-pointer rounded-lg py-3 px-6 font-semibold inline-flex items-center justify-center text-base md:text-lg bg-zinc-900 !text-white dark:bg-white dark:!text-zinc-900"
						>
							Read the docs
						</a>
						<a
							href="https://next-safe-action-playground.vercel.app/"
							className="!no-underline hover:translate-y-[-2px] transition-all hover:shadow-lg cursor-pointer rounded-lg py-3 px-6 font-semibold inline-flex items-center justify-center text-base md:text-lg bg-gradient-to-r from-blue-500 to-purple-500 !text-white"
							target="_blank"
							rel="noopener noreferrer"
						>
							Try the playground ✨
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
