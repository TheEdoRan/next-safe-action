import GitHubLogo from "./github-logo";
import "./globals.css";

export const metadata = {
	title: "Next Safe Action Example",
	description: "A basic implementation of next-safe-action library",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className="antialiased bg-slate-50 dark:bg-slate-950 dark:text-slate-50 text-slate-950 flex flex-col min-h-screen items-center pt-24">
				<a
					id="github-link"
					href="https://github.com/TheEdoRan/next-safe-action"
					target="_blank"
					rel="noopener noreferrer"
					className="mb-8">
					<GitHubLogo width={40} height={40} />
				</a>
				{children}
			</body>
		</html>
	);
}
