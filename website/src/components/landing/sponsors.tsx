export function Sponsors() {
	return (
		<div className="bg-gradient-to-b from-zinc-100 to-zinc-50 py-20 dark:from-zinc-900 dark:to-zinc-950">
			<div className="px-5 md:px-10">
				<div className="mx-auto w-full max-w-7xl">
					<div className="mb-10 text-center md:mb-16">
						<h2 className="mb-4 text-2xl font-bold md:text-3xl lg:text-4xl">Our sponsors</h2>
						<p className="mx-auto max-w-2xl text-zinc-600 dark:text-zinc-400">
							Thanks to these amazing sponsors who help make this project possible! ❤️
						</p>
					</div>

					<div className="mx-auto flex w-full justify-center overflow-auto">
						<div className="inline-block rounded-lg">
							<a href="https://cdn.jsdelivr.net/gh/theedoran/sponsors-img/sponsorkit/sponsors.svg" target="_blank">
								<img
									src="https://cdn.jsdelivr.net/gh/theedoran/sponsors-img/sponsorkit/sponsors.svg"
									alt="Project sponsors"
									className="min-w-[900px]"
									height="auto"
								/>
							</a>
						</div>
					</div>

					<div className="mt-10 text-center">
						<a
							href="/docs/getting-started"
							className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-zinc-900 px-6 py-3 text-base font-semibold !text-white !no-underline transition-all after:ml-2 hover:translate-y-[-2px] hover:shadow-lg hover:after:content-['🚀'] md:text-lg dark:bg-white dark:!text-zinc-900"
						>
							Sponsor the project
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
