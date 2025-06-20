import { Features } from "./features";
import { GettingStarted } from "./getting-started";
import { Hero } from "./hero";
import { Playground } from "./playground";
import { Sponsors } from "./sponsors";
import { Testimonials } from "./testimonials";

export function Landing() {
	return (
		<main className="bg-white dark:bg-zinc-950">
			<Hero />
			<Testimonials />
			<Playground />
			<Features />
			<Sponsors />
			<GettingStarted />
		</main>
	);
}
