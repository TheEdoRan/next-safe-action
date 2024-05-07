import { ExampleLink } from "./_components/example-link";

export default function Home() {
	return (
		<main className="text-center">
			<h1 className="text-4xl font-semibold">Playground</h1>
			<div className="mt-4 flex flex-col space-y-2">
				<ExampleLink href="/direct">Direct call</ExampleLink>
				<ExampleLink href="/with-context">With Context</ExampleLink>
				<ExampleLink href="/nested-schema">Nested schema</ExampleLink>
				<ExampleLink href="/hook">
					<span className="font-mono">useAction</span> hook
				</ExampleLink>
				<ExampleLink href="/optimistic-hook">
					<span className="font-mono">useOptimisticAction</span> hook
				</ExampleLink>
				<ExampleLink href="/stateful-form">
					<span className="font-mono">useStateAction</span> hook
				</ExampleLink>
				<ExampleLink href="/bind-arguments">Bind arguments</ExampleLink>
				<ExampleLink href="/no-arguments">No arguments</ExampleLink>
				<ExampleLink href="/empty-response">Empty response</ExampleLink>
				<ExampleLink href="/react-hook-form">React Hook Form</ExampleLink>
			</div>
		</main>
	);
}
