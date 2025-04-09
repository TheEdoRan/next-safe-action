import { useState } from "react";

export function Playground() {
	const [name, setName] = useState("");
	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = (e) => {
		e.preventDefault();
		setLoading(true);

		// Simulate API call
		setTimeout(() => {
			setResult({ success: true, data: { message: `Hello, ${name || "World"}!` } });
			setLoading(false);
		}, 500);
	};

	return (
		<div className="px-5 md:px-10 py-20 bg-white dark:bg-zinc-950">
			<div className="mx-auto w-full max-w-5xl">
				<div className="text-center mb-12">
					<h2 className="text-2xl md:text-3xl font-bold mb-4">Try it out</h2>
					<p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
						See how next-safe-action handles your server action in real time
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-zinc-50 dark:bg-zinc-900 rounded-xl p-6 md:p-8 shadow-lg">
					<div className="space-y-6">
						<div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
							<div className="text-sm font-semibold mb-2 text-zinc-500 dark:text-zinc-400">Client Component</div>
							<pre className="text-xs md:text-sm font-mono text-zinc-800 dark:text-zinc-200 overflow-auto">
								<code>{`'use client';

import { useAction } from 'next-safe-action/hooks';
import { greetAction } from '@/actions';

export function GreetingForm() {
  const { execute, result, status } = 
    useAction(greetAction);
    
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      execute({ 
        name: formData.get('name') 
      });
    }}>
      <input name="name" />
      <button type="submit">
        {status === 'executing' ? 'Loading...' : 'Submit'}
      </button>
      
      {result?.data && (
        <div>{result.data.message}</div>
      )}
    </form>
  );
}`}</code>
							</pre>
						</div>

						<div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
							<div className="text-sm font-semibold mb-2 text-zinc-500 dark:text-zinc-400">Server Action</div>
							<pre className="text-xs md:text-sm font-mono text-zinc-800 dark:text-zinc-200 overflow-auto">
								<code>{`import { z } from 'zod';
import { createSafeAction } from 'next-safe-action';

export const greetAction = createSafeAction({
  input: z.object({
    name: z.string().min(1)
  }),
  
  handler: async ({ name }) => {
    return { message: \`Hello, \${name}!\` };
  }
});`}</code>
							</pre>
						</div>
					</div>

					<div className="flex flex-col justify-center space-y-8">
						<div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700">
							<h3 className="font-medium text-lg mb-4">Live Demo</h3>

							<form onSubmit={handleSubmit} className="space-y-4">
								<div>
									<label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
										Your name
									</label>
									<input
										type="text"
										id="name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="Enter your name"
										className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none"
									/>
								</div>

								<button
									type="submit"
									disabled={loading}
									className={`w-full py-2 px-4 rounded-md font-medium text-white ${loading ? "bg-blue-400 dark:bg-blue-600" : "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"} transition-colors`}
								>
									{loading ? "Processing..." : "Submit"}
								</button>
							</form>

							{result && (
								<div className="mt-6 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-md">
									<pre className="text-sm font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
										{JSON.stringify(result, null, 2)}
									</pre>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
