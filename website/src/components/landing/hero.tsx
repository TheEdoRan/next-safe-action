import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { Github } from "lucide-react";

export function Hero() {
	const { siteConfig } = useDocusaurusContext();

	return (
		<header className="block bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 bg-center bg-cover overflow-hidden relative">
			<div className="absolute inset-0 pattern-dots pattern-zinc-600 pattern-bg-transparent pattern-size-6 pattern-opacity-10" />
			<div className="px-5 md:px-10">
				<div className="mx-auto w-full max-w-7xl">
					<div className="pt-12 pb-4 md:pt-16 md:pb-8 lg:pt-20">
						<div className="mx-auto flex max-w-3xl flex-col items-center text-center mb-8 md:mb-12 lg:mb-16">
							<div className="text-center z-20">
								<div className="mx-auto max-w-3xl mb-5 md:mb-6 lg:mb-8 flex flex-col items-center">
									<h1 className="text-zinc-800 dark:text-zinc-50 text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight">
										{siteConfig.tagline}
									</h1>
									<h2 className="text-zinc-700 dark:text-zinc-300 font-medium text-base sm:text-lg md:text-xl max-w-xl">
										next-safe-action handles your Next.js app mutations type
										safety, input/output validation, server errors and even
										more!
									</h2>
								</div>
								<div className="flex justify-center items-center gap-4">
									<a
										href="/docs/getting-started"
										className="!no-underline hover:brightness-90 transition !text-zinc-100 cursor-pointer rounded-lg bg-zinc-800 px-3 py-2 font-bold inline-flex items-center justify-center text-sm sm:text-lg md:text-xl">
										Getting started ➡️
									</a>
									<a
										href="https://github.com/TheEdoRan/next-safe-action"
										target="_blank"
										rel="noopener noreferrer"
										className="!no-underline hover:!brightness-90 transition !text-zinc-900 cursor-pointer rounded-lg bg-zinc-100 px-3 py-2 font-bold inline-flex items-center justify-center space-x-1 text-sm sm:text-lg md:text-xl">
										<Github className="w-4 h-4 sm:w-6 sm:h-6" />
										<span>View on GitHub</span>
									</a>
								</div>
							</div>
						</div>
					</div>
					<div className="cursor-pointer relative z-20 flex items-center justify-center mb-8">
						<video width="1280" height="720" controls muted autoPlay>
							<source src="/vid/demo.mp4" type="video/mp4" />
							Your browser does not support the video tag.
						</video>
					</div>
				</div>
			</div>
		</header>
	);
}
