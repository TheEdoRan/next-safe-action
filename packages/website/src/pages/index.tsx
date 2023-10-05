import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import React from "react";
import { Landing } from "../components/landing";

export default function Home(): JSX.Element {
	const { siteConfig } = useDocusaurusContext();
	return (
		<Layout
			title={siteConfig.tagline}
			description="next-safe-action is a library for defining end-to-end typesafe Server Actions for Next.js 13 using Zod.">
			<Landing />
		</Layout>
	);
}
