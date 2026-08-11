"use client";

import { useOffline } from "next/offline";

export function ConnectivityFallback() {
	const isOffline = useOffline();

	return (
		<p className="text-muted-foreground text-sm" data-testid="offline-destination-fallback">
			{isOffline ? "Waiting for connection to load this section..." : "Loading request-time content..."}
		</p>
	);
}
