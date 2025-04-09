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
		<div className="py-20 md:py-24 lg:py-32 bg-zinc-50 dark:bg-zinc-900">
			<div className="px-5 md:px-10">
				<div className="mx-auto w-full max-w-6xl">
					<div className="text-center mb-12 md:mb-16">
						<h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">Why choose next-safe-action?</h2>
						<p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
							A modern, type-safe approach to handling server actions in your Next.js applications
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{features.map((feature, index) => (
							<div
								key={index}
								className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-shadow flex flex-col h-full"
							>
								<div className="bg-blue-50 dark:bg-blue-900/20 rounded-full w-10 h-10 flex items-center justify-center mb-4">
									<Check className="w-5 h-5 text-blue-500 dark:text-blue-400" />
								</div>
								<h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
								<div
									className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed"
									dangerouslySetInnerHTML={{ __html: feature.description }}
								/>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
