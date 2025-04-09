import { useState } from "react";

const packageManagers = ["pnpm", "npm", "yarn"] as const;
type PackageManager = (typeof packageManagers)[number];

const getPmInstall = (pm: PackageManager) => {
	switch (pm) {
		case "pnpm":
			return "pnpm add";
		case "npm":
			return "npm install";
		case "yarn":
			return "yarn add";
		default:
			return "";
	}
};

const libName = "next-safe-action";

type Props = {
	className?: string;
};

export function InstallBox({ className }: Props) {
	const [packageManager, setPackageManager] = useState<PackageManager>("pnpm");
	const [copied, setCopied] = useState(false);

	const copyToClipboard = () => {
		navigator.clipboard.writeText(`${getPmInstall(packageManager)} ${libName}`);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className={`flex flex-col ${className ?? ""}`}>
			<div className="flex items-center gap-2">
				{packageManagers.map((pm) => (
					<button
						key={pm}
						onClick={() => setPackageManager(pm)}
						className={`cursor-pointer bg-zinc-100 dark:bg-zinc-800 border-none rounded py-2 px-6 text-sm font-medium transition-colors relative ${
							packageManager === pm
								? "text-zinc-900 dark:text-zinc-100"
								: "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
						}`}
					>
						{pm}
						{packageManager === pm && (
							<span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-800 dark:bg-zinc-200"></span>
						)}
					</button>
				))}
			</div>

			<div className="mt-2 relative bg-zinc-100 dark:bg-zinc-900 p-4 rounded-md">
				<div className="font-mono text-sm flex items-center">
					<span className="text-zinc-500 mr-3 select-none">$</span>
					<div>
						<span className="text-cyan-800 dark:text-cyan-200">{getPmInstall(packageManager)}</span>
						<span> </span>
						<span className="text-purple-700 dark:text-purple-200">{libName}</span>
					</div>
				</div>
				<button
					onClick={copyToClipboard}
					className="cursor-pointer border-none absolute right-3 top-3 p-1.5 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
					title="Copy to clipboard"
				>
					{copied ? (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-green-500"
						>
							<path d="M20 6 9 17l-5-5" />
						</svg>
					) : (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-zinc-500"
						>
							<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
							<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
						</svg>
					)}
				</button>
			</div>
		</div>
	);
}
