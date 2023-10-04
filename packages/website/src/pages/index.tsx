import Layout from "@theme/Layout";
import React from "react";
import Landing from "../components/landing";

export default function Home(): JSX.Element {
	return (
		<Layout description="next-safe-action is a library for defining typesafe Server Actions for Next.js 13 using Zod.">
			<Landing />
		</Layout>
	);
}
