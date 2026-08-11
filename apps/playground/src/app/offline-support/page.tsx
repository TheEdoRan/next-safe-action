import Link from "next/link";
import { ExampleCard } from "@/components/example-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { OfflineActionDemo } from "./_components/offline-action-demo";

export default function OfflineSupportPage() {
	return (
		<div>
			<PageHeader
				title="Offline Support"
				description="Experimental Next.js recovery for interrupted Server Actions and prefetched navigation."
			/>
			<div className="space-y-6">
				<OfflineActionDemo />
				<ExampleCard
					title="Prefetched App Shell"
					description="Keep this link visible while online so Next.js can prefetch the destination App Shell."
				>
					<Button asChild variant="outline">
						<Link href="/offline-support/destination" data-testid="offline-destination-link">
							Open offline destination
						</Link>
					</Button>
				</ExampleCard>
				<ExampleCard title="Test It">
					<ol className="list-decimal space-y-2 pl-5 text-sm">
						<li>Load this page online and keep the destination link visible until it is prefetched.</li>
						<li>Go offline, then run the action. It stays pending and reports the offline state.</li>
						<li>Reconnect. The action completes without another click and shows the server result.</li>
						<li>Go offline again and open the destination. Its shell and offline fallback render from the prefetch.</li>
						<li>Reconnect to stream the request-time section into the destination.</li>
					</ol>
					<p className="text-muted-foreground mt-4 text-sm">
						Current limitation: if you start the mutation offline and then click the destination link, the request-time
						navigation content waits on the same connection as the action. The prefetched shell can render, and both
						requests complete after reconnection.
					</p>
					<p className="text-muted-foreground mt-2 text-sm">
						A full reload while offline is not supported because this demo does not install a service worker.
					</p>
				</ExampleCard>
			</div>
		</div>
	);
}
