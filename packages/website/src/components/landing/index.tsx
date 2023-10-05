import React from "react";
import { Features } from "./features";
import { GettingStarted } from "./getting-started";
import { Hero } from "./hero";
import { Testimonials } from "./testimonials";

export function Landing() {
	return (
		<main>
			<Hero />
			<Features />
			<div className="h-px min-h-[1px] min-w-full bg-stone-200 dark:bg-stone-700"></div>
			<Testimonials />
			<div className="h-px min-h-[1px] min-w-full bg-stone-200 dark:bg-stone-700"></div>
			<GettingStarted />
		</main>
	);
}
