import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { GitHubButton } from "./github-button";
import { HeroExample } from "./hero-example";
import { InstallBox } from "./install-box";

export function Hero() {
	const { siteConfig } = useDocusaurusContext();

	return (
		<header className="relative py-16 md:py-24 lg:py-32 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 overflow-hidden">
			<div className="px-5 md:px-10">
				<div className="mx-auto w-full max-w-7xl">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						<div className="flex flex-col z-10">
							<div>
								<h1 className="py-1 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 mb-4">
									{siteConfig.tagline}
								</h1>
								<h2 className="text-zinc-700 dark:text-zinc-300 text-base md:text-lg max-w-xl leading-relaxed font-medium">
									next-safe-action handles your Next.js app mutations type safety, input/output validation, server
									errors and even more!
								</h2>
							</div>

							<InstallBox className="mt-6" />

							<div className="flex gap-4 mt-8">
								<a
									href="/docs/getting-started"
									className="!no-underline hover:translate-y-[-2px] transition-transform border border-zinc-300 dark:border-zinc-700 !text-zinc-800 dark:!text-zinc-200 cursor-pointer rounded-lg bg-white dark:bg-zinc-800 px-4 py-2 md:px-5 md:py-3 font-semibold inline-flex items-center justify-center space-x-2 text-sm md:text-base"
								>
									Getting started
								</a>
								<GitHubButton />
							</div>
						</div>

						<HeroExample />
					</div>
				</div>
			</div>
		</header>
	);
}
