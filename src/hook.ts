import { experimental_useOptimistic, useCallback, useRef, useState, useTransition } from "react";
import {} from "react/experimental";
import type { z } from "zod";
import type { ClientAction } from "./types";

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

export const useOptimisticAction = <const IV extends z.ZodTypeAny, const AO, State extends object>(
	clientAction: ClientAction<IV, AO>,
	currentState: State
) => {
	const [optState, syncState] = experimental_useOptimistic<
		State & { isExecuting: boolean },
		Partial<State>
	>({ ...currentState, isExecuting: false }, (state, newState) => ({
		...state,
		...(newState ?? {}),
		isExecuting: true,
	}));

	const executor = useRef(clientAction);
	const [res, setRes] = useState<
		(Awaited<ReturnType<typeof clientAction>> & { fetchError?: any }) | null
	>(null);

	const execute = useCallback(
		(input: z.input<IV>, newServerState: Partial<State>) => {
			syncState(newServerState);

			executor
				.current(input)
				.then((res) => setRes(res))
				.catch((e) => {
					setRes({ fetchError: e });
				});
		},
		[syncState]
	);

	const { isExecuting, ...optimisticState } = optState;

	return {
		execute,
		isExecuting,
		res,
		optimisticState,
	};
};
