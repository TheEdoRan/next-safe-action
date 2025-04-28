export function GettingStarted() {
	return (
		<div className="relative bg-gradient-to-b from-zinc-50 to-white py-24 md:py-32 dark:from-zinc-950 dark:to-black">
			{/* Bubblegum background elements */}
			<div className="absolute -left-24 -top-24 size-64 rounded-full bg-gradient-to-r from-blue-300 to-purple-300 opacity-60 blur-3xl dark:from-blue-700 dark:to-purple-700 dark:opacity-10"></div>
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -right-32 top-1/2 size-80 overflow-hidden rounded-full bg-gradient-to-r from-purple-300 to-blue-300 opacity-60 blur-3xl dark:from-purple-700 dark:to-blue-700 dark:opacity-10"></div>
			</div>

			<div className="relative px-5 md:px-10">
				<div className="mx-auto w-full max-w-4xl text-center">
					<h2 className="mb-8 inline-block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl md:text-4xl dark:from-blue-400 dark:to-purple-400">
						Ready to get started?
					</h2>
					<p className="mx-auto mb-12 max-w-xl text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
						Explore the documentation to learn how to use next-safe-action in your Next.js projects. Whether you're a
						beginner or already experienced with it, we've got you covered with comprehensive guides and examples.
					</p>
					<div className="flex flex-wrap items-center justify-center gap-4">
						<a
							href="/docs/getting-started"
							className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-zinc-900 px-6 py-3 text-base font-semibold !text-white !no-underline transition-all hover:translate-y-[-2px] hover:shadow-lg md:text-lg dark:bg-white dark:!text-zinc-900"
						>
							Read the docs
						</a>
						<a
							href="https://next-safe-action-playground.vercel.app/"
							className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 text-base font-semibold !text-white !no-underline transition-all hover:translate-y-[-2px] hover:shadow-lg md:text-lg"
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
