"use client";

import { useEffect, useRef, useState } from "react";

export function Playground() {
	const [isVisible, setIsVisible] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.1 }
		);

		if (containerRef.current) {
			observer.observe(containerRef.current);
		}

		return () => {
			observer.disconnect();
		};
	}, []);

	return (
		<div className="w-full bg-zinc-50 py-6 dark:bg-zinc-950" ref={containerRef}>
			<div className="mx-auto w-full max-w-7xl">
				<div className="mb-12 text-center">
					<h2 className="mb-4 text-2xl font-bold md:text-3xl">Try it out</h2>
					<p className="mx-auto max-w-2xl text-zinc-600 dark:text-zinc-400">
						See how next-safe-action lets you handle Server Actions in a type safe way.
					</p>
				</div>
				{isVisible && (
					<iframe
						loading="lazy"
						onError={() => {}}
						className="mx-auto h-[40rem] w-full rounded-lg"
						src="https://stackblitz.com/edit/next-safe-action-playground?embed=1&file=src%2Flib%2Fsafe-action.ts&ctl=1"
					/>
				)}
			</div>
		</div>
	);
}
