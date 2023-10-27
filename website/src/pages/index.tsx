import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import React from "react";
import { Landing } from "../components/landing";

export default function Home(): JSX.Element {
	const { siteConfig } = useDocusaurusContext();
	return (
		<Layout
			title={siteConfig.tagline}
			description="next-safe-action is a library for defining end-to-end typesafe and validated Server Actions in Next.js (App Router) projects.">
			<Landing />
		</Layout>
	);
}
