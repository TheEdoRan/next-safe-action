"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

const tabs = [
	{ id: "client", label: "safe-action.ts" },
	{ id: "action", label: "greet-action.ts" },
	{ id: "component", label: "greet.tsx" },
] as const;

type Tab = (typeof tabs)[number]["id"];

export function HeroExample() {
	const [activeTab, setActiveTab] = useState<Tab>("action");

	const codeContent = {
		client: `import { createSafeActionClient } from "next-safe-action";

// Create the client with default options.
export const actionClient = createSafeActionClient();`,
		action: `"use server";

import { z } from "zod";
import { actionClient } from "./safe-action";

const inputSchema = z.object({
  name: z.string().min(1),
});

export const greetAction = actionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { name } }) => {
    return {
      message: \`Hello, \${name}!\`,
    };
  });`,
		component: `"use client";

import { useAction } from "next-safe-action/hooks";
import { greetAction } from "./greet-action";

export function Greet() {
  const { execute, result, reset } = useAction(greetAction);

  return (
    <div className="flex flex-col gap-2 w-full">
      <pre>{JSON.stringify(result, null, 1)}</pre>
      <button onClick={() => execute({ name: "John Doe" })}>
        Click here
      </button>
      <button onClick={() => reset()}>Reset</button>
    </div>
  );
}`,
	};

	return (
		<div className="group relative h-[30rem] rounded-xl shadow-xl">
			<div className="animate-gradient-rotate bg-300% pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-padding blur-lg transition-all group-hover:brightness-75 dark:group-hover:brightness-125" />
			<div className="absolute inset-0 rounded-xl border-zinc-800 bg-zinc-900 p-4 text-white">
				<div className="mb-3 flex items-center border-b border-zinc-800">
					<div className="xs:flex absolute left-4 hidden space-x-2">
						<div className="h-3 w-3 rounded-full bg-red-500"></div>
						<div className="h-3 w-3 rounded-full bg-yellow-500"></div>
						<div className="h-3 w-3 rounded-full bg-green-500"></div>
					</div>
					<div className="mx-auto flex space-x-4">
						<div className="flex items-center">
							{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`relative cursor-pointer rounded border-none bg-transparent px-2 py-1 text-sm font-medium transition-colors ${
										activeTab === tab.id ? "text-zinc-100" : "text-zinc-400 hover:text-zinc-300"
									}`}
								>
									{tab.label}
									{activeTab === tab.id && <span className="absolute bottom-0 left-0 h-0.5 w-full bg-zinc-200"></span>}
								</button>
							))}
						</div>
					</div>
				</div>
				<div className="h-[calc(100%-2.5rem)] overflow-auto">
					<SyntaxHighlighter
						language="typescript"
						style={vscDarkPlus}
						customStyle={{
							background: "transparent",
							margin: 0,
							padding: "1rem",
							fontSize: "0.875rem",
						}}
					>
						{codeContent[activeTab]}
					</SyntaxHighlighter>
				</div>
			</div>
		</div>
	);
}
