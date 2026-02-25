"use client";

import { StyledButton } from "@/app/_components/styled-button";
import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { ResultBox } from "../../_components/result-box";
import { testRevalidationCallbacks } from "./revalidation-callbacks-action";

type CallbackEvent = "onExecute" | "onSuccess" | "onError" | "onSettled";

type CallbackLogItem = {
	id: string;
	event: CallbackEvent;
	at: string;
	status: string;
	isTransitioning: boolean;
	isPending: boolean;
};

type FlagSnapshot = {
	status: string;
	isTransitioning: boolean;
	isPending: boolean;
};

export default function RevalidationCallbacksClient() {
	const [callbackLog, setCallbackLog] = useState<CallbackLogItem[]>([]);
	const latestFlagsRef = useRef<FlagSnapshot>({
		status: "idle",
		isTransitioning: false,
		isPending: false,
	});

	const pushLog = (event: CallbackEvent) => {
		const flags = latestFlagsRef.current;

		setCallbackLog((prev) => [
			{
				id: crypto.randomUUID(),
				event,
				at: new Date().toISOString(),
				status: flags.status,
				isTransitioning: flags.isTransitioning,
				isPending: flags.isPending,
			},
			...prev,
		]);

		console.log("pushLog", event, flags);
	};

	const { execute, result, status, reset, isExecuting, isTransitioning, isPending, hasSucceeded, hasErrored } =
		useAction(testRevalidationCallbacks, {
			onExecute() {
				pushLog("onExecute");
			},
			onSuccess() {
				pushLog("onSuccess");
			},
			onError() {
				pushLog("onError");
			},
			onSettled() {
				pushLog("onSettled");
			},
		});

	latestFlagsRef.current = {
		status,
		isTransitioning,
		isPending,
	};

	return (
		<div className="mt-6">
			<p className="text-center text-sm">
				Trigger actions that call <code>revalidatePath</code> or <code>revalidateTag</code> and verify callbacks fire
				even if <code>isTransitioning</code> stays true.
			</p>
			<div className="mt-4 flex flex-col gap-2">
				<StyledButton type="button" onClick={() => execute({ kind: "revalidatePath" })}>
					Execute revalidatePath
				</StyledButton>
				<StyledButton type="button" onClick={() => execute({ kind: "revalidateTag" })}>
					Execute revalidateTag
				</StyledButton>
				<StyledButton type="button" onClick={reset}>
					Reset action state
				</StyledButton>
				<StyledButton
					type="button"
					onClick={() => {
						setCallbackLog([]);
					}}
				>
					Clear callback log
				</StyledButton>
			</div>

			<div className="mt-6 space-y-1 text-sm">
				<p>
					<strong>Status:</strong> {status}
				</p>
				<p>
					<strong>isExecuting:</strong> {String(isExecuting)}
				</p>
				<p>
					<strong>isTransitioning:</strong> {String(isTransitioning)}
				</p>
				<p>
					<strong>isPending:</strong> {String(isPending)}
				</p>
				<p>
					<strong>hasSucceeded:</strong> {String(hasSucceeded)}
				</p>
				<p>
					<strong>hasErrored:</strong> {String(hasErrored)}
				</p>
			</div>

			<ResultBox result={result} status={status} />

			<div className="mt-8">
				<p className="text-lg font-semibold">Callback log</p>
				{callbackLog.length === 0 ? (
					<p className="mt-2 text-sm">No callbacks yet.</p>
				) : (
					<ul className="mt-2 space-y-2 text-sm">
						{callbackLog.map((entry) => (
							<li key={entry.id} className="rounded-md border p-2">
								<p>
									<strong>{entry.event}</strong> at {entry.at}
								</p>
								<p>Status at callback: {entry.status}</p>
								<p>isTransitioning: {String(entry.isTransitioning)}</p>
								<p>isPending: {String(entry.isPending)}</p>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
