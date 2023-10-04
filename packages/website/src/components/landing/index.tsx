import React from "react";
import { Hero } from "../hero";
import { Features } from "./features";
import { Testimonials } from "./testimonials";

export function Landing() {
	return (
		<main>
			<Hero />
			<Features />
			<div className="h-px min-h-[1px] min-w-full bg-stone-200 dark:bg-stone-700"></div>
			<Testimonials />
		</main>
	);
}
