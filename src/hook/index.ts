import { useCallback, useRef, useState } from "react";
import type { z } from "zod";
import type { ClientAction } from "../types";

export const useAction = <const IV extends z.ZodTypeAny, const AO>(
	clientAction: ClientAction<IV, AO>
) => {
	const executor = useRef(clientAction);
	const [isExecuting, setIsExecuting] = useState(false);
	const [res, setRes] = useState<
		(Awaited<ReturnType<typeof clientAction>> & { fetchError?: any }) | null
	>(null);

	const execute = useCallback(async (input: z.input<IV>) => {
		setIsExecuting(true);

		try {
			const r = await executor.current(input);
			setRes(r);
		} catch (e) {
			// If fetch fails.
			setRes({ fetchError: e });
		}

		setIsExecuting(false);
	}, []);

	return {
		execute,
		isExecuting,
		res,
	};
};
