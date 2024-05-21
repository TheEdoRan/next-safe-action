import { Check } from "lucide-react";
import { Fragment } from "react";

const features: { title: string; description: string }[] = [
	{
		title: "Pretty simple",
		description:
			"No need to overcomplicate things. next-safe-action API is pretty simple, designed with fast development in mind.",
	},
	{
		title: "End-to-end type safety",
		description:
			"With next-safe-action you get full type safety between server and client code.",
	},
	{
		title: "Form Actions support",
		description:
			"next-safe-action supports Form Actions out of the box, with stateful and stateless actions.",
	},
	{
		title: "Powerful middleware system",
		description:
			"Manage authorization, log and halt execution, and much more with a composable middleware system.",
	},
	{
		title: "Input validation using multiple validation libraries",
		description:
			"Input passed from the client to the server is validated using libraries of your choice.",
	},
	{
		title: "Advanced server error handling",
		description:
			"Decide how to return execution errors to the client and how to log them on the server.",
	},
	{
		title: "Optimistic updates",
		description:
			"Need to update UI immediately without waiting for server response? You can do it with the powerful <code>useOptimisticAction</code> hook.",
	},
];

export function Features() {
	return (
		<div className="px-5 md:px-10">
			<div className="mx-auto w-full max-w-4xl">
				<div className="flex-col flex gap-y-20 max-[479px]:gap-[60px] items-center lg:items-center py-20 lg:py-24">
					<div className="flex-col flex items-center justify-center gap-y-[60px] max-[479px]:gap-[60px]">
						<div className="text-center font-bold text-3xl sm:text-4xl lg:text-5xl">
							Why choose next-safe-action?
						</div>
						<div className="min-w-full bg-white dark:bg-zinc-800 max-[479px]:px-5 max-[479px]:py-6 rounded-xl p-8 md:p-10 flex flex-col space-y-6">
							{features.map(({ title, description }, idx) => (
								<Fragment key={idx}>
									{idx > 0 ? (
										<div className="h-px min-h-[1px] min-w-full bg-zinc-200 dark:bg-zinc-700"></div>
									) : null}
									<div className="flex space-x-2 sm:space-x-4 md:space-x-6">
										<Check className="w-8 h-8 shrink-0" />
										<div className="flex-col flex items-start gap-y-2 max-[479px]:pr-10">
											<div className="font-bold text-xl sm:text-xl">
												{title}
											</div>
											<div
												className="text-[#8a8880] text-base sm:text-base"
												dangerouslySetInnerHTML={{ __html: description }}
											/>
										</div>
									</div>
								</Fragment>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
