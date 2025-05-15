import { Check } from "lucide-react";

const features: { title: string; description: string; icon?: string }[] = [
	{
		title: "Pretty simple",
		description:
			"No need to overcomplicate things.<br/>next-safe-action API is pretty simple, designed for the best possible DX.",
	},
	{
		title: "End-to-end type safe",
		description: "With next-safe-action you get full type safety between server and client code.",
	},
	{
		title: "Input/output validation",
		description:
			'next-safe-action supports any validation library supported by Standard Schema. You can use Zod, Valibot, ArkType, and <a href="https://github.com/standard-schema/standard-schema?tab=readme-ov-file#what-schema-libraries-implement-the-spec" target="_blank" rel="noopener noreferrer">many more</a>!',
	},
	{
		title: "Powerful middleware system",
		description: "Manage authorization, log and halt execution, and much more with a composable middleware system.",
	},
	{
		title: "Advanced error handling",
		description:
			"Decide how to return execution and validation errors to the client and how to log them on the server.",
	},
	{
		title: "Form Actions support",
		description: "next-safe-action supports Form Actions out of the box, with stateful and stateless actions.",
	},
	{
		title: "Optimistic updates",
		description:
			"Need to update UI immediately without waiting for server response? You can do it with the powerful <code>useOptimisticAction</code> hook.",
	},
	{
		title: "Integration with third party libraries",
		description:
			"next-safe-action is designed to be extensible. You can easily integrate it with third party libraries, like react-hook-form.",
	},
];

export function Features() {
	return (
		<div className="bg-gradient-to-b from-zinc-50 to-zinc-100 py-20 md:py-24 lg:py-24 dark:from-zinc-950 dark:to-zinc-900">
			<div className="px-5 md:px-10">
				<div className="mx-auto w-full max-w-6xl">
					<div className="mb-12 text-center md:mb-16">
						<h2 className="mb-4 text-2xl font-bold md:text-3xl lg:text-4xl">Why choose next-safe-action?</h2>
						<p className="mx-auto max-w-2xl text-zinc-600 dark:text-zinc-400">
							A type-safe approach to handling Server Actions in your Next.js applications
						</p>
					</div>

					<div className="wfull flex flex-wrap justify-center gap-6">
						{features.map((feature, index) => (
							<div key={index} className="group relative h-[16rem] w-full max-w-[22rem] rounded-xl">
								<div className="animate-gradient-rotate pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 bg-clip-padding blur-sm transition-all group-hover:brightness-75 dark:from-blue-700 dark:via-indigo-700 dark:to-purple-700 dark:group-hover:brightness-125" />
								<div className="absolute inset-0 flex flex-col rounded-xl bg-zinc-100 p-6 dark:bg-zinc-900">
									<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
										<Check className="h-5 w-5 text-blue-500 dark:text-blue-400" />
									</div>
									<h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
									<div
										className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400"
										dangerouslySetInnerHTML={{ __html: feature.description }}
									/>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
