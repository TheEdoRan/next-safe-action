import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import React from "react";
import { StarsButton } from "./stars-button";

export function Hero() {
	const { siteConfig } = useDocusaurusContext();

	return (
		<header className="block bg-gradient-to-b from-[#f79f2d] to-[#ff8e0a] bg-center bg-cover overflow-hidden relative">
			<div className="absolute inset-0 pattern-dots pattern-stone-600 pattern-bg-transparent pattern-size-6 pattern-opacity-10" />
			<div className="px-5 md:px-10">
				<div className="mx-auto w-full max-w-7xl">
					<div className="pt-12 pb-4 md:pt-16 md:pb-8 lg:pt-20">
						<div className="mx-auto flex max-w-3xl flex-col items-center text-center mb-8 md:mb-12 lg:mb-16">
							<div className="text-center z-20">
								<div className="mx-auto max-w-3xl mb-5 md:mb-6 lg:mb-8 flex flex-col items-center">
									<h1 className="text-white text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight">
										{siteConfig.tagline}
									</h1>
									<h2 className="text-stone-50 font-medium text-base sm:text-lg md:text-xl max-w-xl">
										next-safe-action handles your Next.js app mutations type
										safety, input validation, server errors and even more!
									</h2>
								</div>
								<div className="flex justify-center items-center">
									<a
										href="/docs/getting-started"
										className="!no-underline hover:brightness-90 transition !text-stone-100 cursor-pointer rounded-lg mr-4 bg-stone-800 px-3 py-2 font-bold inline-flex items-center justify-center text-sm sm:text-lg md:text-xl">
										Getting started 🎉
									</a>
									<StarsButton />
								</div>
							</div>
						</div>
					</div>
					<a
						href="/docs/getting-started"
						className="cursor-pointer relative z-20 flex items-center justify-center mb-8">
						<video width="1280" height="720" controls autoPlay>
							<source src="/vid/demo.mp4" type="video/mp4" />
							Your browser does not support the video tag.
						</video>
					</a>
				</div>
			</div>
		</header>
	);
}
