import React from "react";
import StarButton from "./landing/star-button";

export default function Hero() {
	return (
		<header className="block bg-gradient-to-b from-[#f79f2d] to-[#ff8e0a] bg-center bg-cover overflow-hidden relative">
			<div className="absolute inset-0 pattern-dots pattern-stone-600 pattern-bg-transparent pattern-size-6 pattern-opacity-10" />
			<div className="px-5 md:px-10">
				<div className="mx-auto w-full max-w-7xl">
					<div className="py-12 md:py-16 lg:py-20">
						<div className="mx-auto flex max-w-3xl flex-col items-center text-center mb-8 md:mb-12 lg:mb-16">
							<div className="text-center z-20">
								<div className="mx-auto max-w-[528px] mb-5 md:mb-6 lg:mb-8">
									<h1 className="text-white text-4xl font-bold tracking-tighter">
										End-to-end typesafe Server Actions for Next.js 13
									</h1>
									<h2 className="text-stone-50 mt-4">
										next-safe action handles type safety, input validation,
										server errors and more for your Next.js app.
									</h2>
								</div>
								<div className="flex justify-center items-center">
									<a
										href="/docs/getting-started"
										className="cursor-pointer rounded-lg mr-4 bg-stone-800 px-3 py-2 font-bold inline-flex items-center justify-center">
										Getting started
									</a>
									<StarButton width="170" height="50" />
								</div>
							</div>
						</div>
					</div>
					<div className="relative z-20">
						<img
							className="inline-block max-h-[416px] w-full max-w-full rounded-tl-[50px] rounded-tr-[50px] border-[12px] border-[#ffffff1f] object-fill z-20"
							src="https://assets.website-files.com/647e296b89c00bcfafccf696/647f0755ed7ed2b1be74354e_image_processing20220429-712-h76k3c%202.png"
							alt="Hero image showing dashboard"
						/>
					</div>
				</div>
			</div>
		</header>
	);
}
