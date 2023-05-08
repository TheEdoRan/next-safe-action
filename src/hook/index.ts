import { useCallback, useRef, useState, useTransition } from "react";
import type { z } from "zod";
import type { ClientAction } from "../types";

export const useAction = <const IV extends z.ZodTypeAny, const AO>(
	clientAction: ClientAction<IV, AO>
) => {
	const [isExecuting, startTransition] = useTransition();
	const executor = useRef(clientAction);
	const [res, setRes] = useState<
		(Awaited<ReturnType<typeof clientAction>> & { fetchError?: any }) | null
	>(null);

	const execute = useCallback(async (input: z.input<IV>) => {
		startTransition(() => {
			executor
				.current(input)
				.then((res) => setRes(res))
				.catch((e) => {
					setRes({ fetchError: e });
				});
		});
	}, []);

	return {
		execute,
		isExecuting,
		res,
	};
};
