import { StyledHeading } from "@/app/_components/styled-heading";
import { Suspense } from "react";
import RevalidationCallbacksClient from "./revalidation-callbacks-client";
import {
	REVALIDATION_CALLBACKS_TAG,
	getRevalidationCallbacksLiveSnapshot,
	getRevalidationCallbacksTaggedSnapshot,
} from "./revalidation-callbacks-store";

async function RevalidationSnapshots() {
	const [liveSnapshot, taggedSnapshot] = await Promise.all([
		getRevalidationCallbacksLiveSnapshot(),
		getRevalidationCallbacksTaggedSnapshot(),
	]);

	return (
		<div className="mt-6 space-y-4">
			<div>
				<p className="text-lg font-semibold">Live server snapshot</p>
				<pre className="mt-2 text-sm">{JSON.stringify(liveSnapshot, null, 1)}</pre>
			</div>
			<div>
				<p className="text-lg font-semibold">
					Tagged snapshot (<code>{REVALIDATION_CALLBACKS_TAG}</code>)
				</p>
				<pre className="mt-2 text-sm">{JSON.stringify(taggedSnapshot, null, 1)}</pre>
			</div>
		</div>
	);
}

export default function RevalidationCallbacksPage() {
	return (
		<main className="w-[32rem] max-w-full px-4">
			<StyledHeading>Revalidation callbacks</StyledHeading>
			<p className="mt-4 text-sm text-center">
				This example helps validate that <code>onSuccess</code> / <code>onSettled</code> still run when a server
				action calls Next cache revalidation APIs.
			</p>

			<Suspense fallback={<p className="mt-6 text-sm text-center">Loading snapshots...</p>}>
				<RevalidationSnapshots />
			</Suspense>

			<RevalidationCallbacksClient />
		</main>
	);
}
