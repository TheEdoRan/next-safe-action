"use client";

import { WifiOffIcon } from "lucide-react";
import { useOffline } from "next/offline";

export function OfflineBar() {
	const isOffline = useOffline();

	if (!isOffline) {
		return null;
	}

	return (
		<div
			className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-950 dark:bg-amber-950 dark:text-amber-100"
			role="status"
			aria-live="polite"
			data-testid="offline-bar"
		>
			<span className="inline-flex items-center gap-2">
				<WifiOffIcon className="size-4" aria-hidden="true" />
				Offline. Pending requests will retry when the connection returns.
			</span>
		</div>
	);
}
