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
			<body>
				<a
					id="github-link"
					href="https://github.com/TheEdoRan/next-safe-action"
					target="_blank"
					rel="noopener noreferrer">
					<GitHubLogo width={40} height={40} />
				</a>
				{children}
			</body>
		</html>
	);
}
