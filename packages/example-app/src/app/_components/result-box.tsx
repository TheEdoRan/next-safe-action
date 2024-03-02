import { HookActionStatus } from "next-safe-action/hooks";

type Props = {
	result: any;
	status?: HookActionStatus;
};

export function ResultBox({ result, status }: Props) {
	return (
		<div className="mt-8">
			{status ? (
				<p className="text-lg font-semibold">Execution status: {status}</p>
			) : null}
			<p className="text-lg font-semibold">Action result:</p>
			<pre className="mt-4">{JSON.stringify(result, null, 1)}</pre>
		</div>
	);
}
