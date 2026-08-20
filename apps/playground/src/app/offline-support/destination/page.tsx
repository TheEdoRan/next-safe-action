import { connection } from "next/server";
import { Suspense } from "react";
import { ExampleCard } from "@/components/example-card";
import { PageHeader } from "@/components/page-header";
import { ConnectivityFallback } from "./connectivity-fallback";

export default function OfflineDestinationPage() {
	return (
		<div data-testid="offline-destination-shell">
			<PageHeader
				title="Offline Destination"
				description="This static App Shell is available from the link prefetch."
			/>
			<ExampleCard title="Request-time Content">
				<Suspense fallback={<ConnectivityFallback />}>
					<RequestTimeContent />
				</Suspense>
			</ExampleCard>
		</div>
	);
}

async function RequestTimeContent() {
	await connection();

	return (
		<p className="text-sm" data-testid="offline-destination-dynamic">
			Dynamic content received at <time>{new Date().toISOString()}</time>.
		</p>
	);
}
