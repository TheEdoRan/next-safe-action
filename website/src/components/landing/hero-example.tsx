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
		<div className="h-[30rem] relative hidden lg:block rounded-xl shadow-xl">
			<div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-sky-700 to-purple-700 blur-lg rounded-xl" />
			<div className="absolute inset-0 bg-zinc-900 text-white border-zinc-800 p-4 rounded-xl">
				<div className="flex items-center mb-3 border-b border-zinc-800">
					<div className="flex space-x-2 absolute left-4">
						<div className="w-3 h-3 rounded-full bg-red-500"></div>
						<div className="w-3 h-3 rounded-full bg-yellow-500"></div>
						<div className="w-3 h-3 rounded-full bg-green-500"></div>
					</div>
					<div className="flex mx-auto space-x-4">
						<div className="flex items-center">
							{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`cursor-pointer bg-transparent border-none rounded py-1 px-2 text-sm font-medium transition-colors relative ${
										activeTab === tab.id ? "text-zinc-100" : "text-zinc-400 hover:text-zinc-300"
									}`}
								>
									{tab.label}
									{activeTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-200"></span>}
								</button>
							))}
						</div>
					</div>
				</div>
				<div className="overflow-auto h-[calc(100%-2.5rem)]">
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
