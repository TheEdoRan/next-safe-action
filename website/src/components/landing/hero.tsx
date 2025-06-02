import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { GitHubButton } from "./github-button";
import { HeroExample } from "./hero-example";
import { InstallBox } from "./install-box";

export function Hero() {
	const { siteConfig } = useDocusaurusContext();

	return (
		<header className="relative overflow-hidden bg-gradient-to-b from-zinc-50 to-zinc-100 py-16 md:py-24 lg:py-32 dark:from-zinc-900 dark:to-zinc-950">
			<div className="px-5 md:px-10">
				<div className="mx-auto w-full max-w-7xl">
					<div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
						<div className="z-10 flex flex-col">
							<div>
								<h1 className="mb-4 bg-gradient-to-r from-zinc-800 to-zinc-600 bg-clip-text py-1 text-3xl font-bold tracking-tight text-transparent md:text-4xl lg:text-5xl dark:from-zinc-100 dark:to-zinc-400">
									{siteConfig.tagline}
								</h1>
								<h2 className="max-w-xl text-base font-medium leading-relaxed text-zinc-700 md:text-lg dark:text-zinc-300">
									next-safe-action handles your Next.js app mutations type safety, input/output validation, server
									errors and even more!
								</h2>
							</div>

							<InstallBox className="mt-6" />

							<div className="mt-6 flex gap-4">
								<GitHubButton />
								<a
									href="/docs/getting-started"
									className="inline-flex cursor-pointer items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-semibold !text-zinc-100 !no-underline shadow-lg transition-transform hover:translate-y-[-2px] md:text-base"
								>
									Get started ✨
								</a>
							</div>
						</div>

						<HeroExample />
					</div>
				</div>
			</div>
		</header>
	);
}
