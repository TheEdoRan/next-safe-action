import { connection } from "next/server";
import { Suspense } from "react";
import { StyledHeading } from "@/app/_components/styled-heading";
import { BindArgumentsClientPage } from "./bind-arguments-client";

async function BindArgumentsRuntimeContent() {
	await connection();
	const randomAge = Math.floor(Math.random() * 200);
	const randomUserId = crypto.randomUUID();

	return <BindArgumentsClientPage age={randomAge} userId={randomUserId} />;
}

export default function BindArgumentsPage() {
	return (
		<Suspense
			fallback={
				<main className="w-96 max-w-full px-4">
					<StyledHeading>Action binding arguments</StyledHeading>
				</main>
			}
		>
			<BindArgumentsRuntimeContent />
		</Suspense>
	);
}
