import {
	experimental_useOptimistic,
	useCallback,
	useEffect,
	useRef,
	useState,
	useTransition,
} from "react";
import {} from "react/experimental";
import type { z } from "zod";
import type { ClientCaller } from ".";

// ********************* TYPES *********************

/**
 * Type of `res` object returned by `useAction` and `useOptimisticAction` hooks.
 */
export type HookRes<IV extends z.ZodTypeAny, Data> = Awaited<ReturnType<ClientCaller<IV, Data>>> & {
	fetchError?: unknown;
};

/**
 * Type of hooks callbacks (`onSuccess` and `onError`).
 * These are executed when the action succeeds or fails.
 */
export type HookCallbacks<IV extends z.ZodTypeAny, Data> = {
	onSuccess?: (
		data: NonNullable<Pick<HookRes<IV, Data>, "data">["data"]>,
		reset: () => void
	) => void;
	onError?: (error: Omit<HookRes<IV, Data>, "data">, reset: () => void) => void;
};

// ********************* FUNCTIONS *********************

const getActionStatus = <const IV extends z.ZodTypeAny, const Data>(res: HookRes<IV, Data>) => {
	const hasSucceded = typeof res.data !== "undefined";
	const hasErrored =
		typeof res.validationError !== "undefined" ||
		typeof res.serverError !== "undefined" ||
		typeof res.fetchError !== "undefined";

	const hasExecuted = hasSucceded || hasErrored;

	return { hasExecuted, hasSucceded, hasErrored };
};

const useActionCallbacks = <const IV extends z.ZodTypeAny, const Data>(
	res: HookRes<IV, Data>,
	hasSucceded: boolean,
	hasErrored: boolean,
	reset: () => void,
	cb?: HookCallbacks<IV, Data>
) => {
	const onSuccessRef = useRef(cb?.onSuccess);
	const onErrorRef = useRef(cb?.onError);

	// Execute the callback on success or error, if provided.
	useEffect(() => {
		const onSuccess = onSuccessRef.current;
		const onError = onErrorRef.current;

		if (onSuccess && hasSucceded) {
			onSuccess(res.data!, reset);
		} else if (onError && hasErrored) {
			onError(res, reset);
		}
	}, [hasErrored, hasSucceded, res, reset]);
};

/**
 * Use the action from a Client Component via hook.
 * @param clientCaller Caller function with typesafe input data for the Server Action.
 * @param cb Optional callbacks executed when the action succeeds or fails.
 *
 * {@link https://github.com/theedoran/next-safe-action#2-the-hook-way See an example}
 */
export const useAction = <const IV extends z.ZodTypeAny, const Data>(
	clientCaller: ClientCaller<IV, Data>,
	cb?: HookCallbacks<IV, Data>
) => {
	const [isExecuting, startTransition] = useTransition();
	const executor = useRef(clientCaller);
	const [res, setRes] = useState<HookRes<IV, Data>>({});

	const { hasExecuted, hasSucceded, hasErrored } = getActionStatus<IV, Data>(res);

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

	const reset = useCallback(() => {
		setRes({});
	}, []);

	useActionCallbacks(res, hasSucceded, hasErrored, reset, cb);

	return {
		execute,
		isExecuting,
		res,
		reset,
		hasExecuted,
		hasSucceded,
		hasErrored,
	};
};

/**
 * Use the action from a Client Component via hook, with optimistic state update.
 *
 * **NOTE: This hook uses an experimental React feature.**
 * @param clientCaller Caller function with typesafe input data for the Server Action.
 * @param defaultOptState Default (initial) optimistic state.
 * @param cb Optional callbacks executed when the action succeeds or fails.
 *
 * {@link https://github.com/theedoran/next-safe-action#optimistic-update--experimental See an example}
 */
export const useOptimisticAction = <
	const IV extends z.ZodTypeAny,
	const Data,
	State extends object
>(
	clientCaller: ClientCaller<IV, Data>,
	defaultOptState: State,
	cb?: HookCallbacks<IV, Data>
) => {
	const [optState, syncState] = experimental_useOptimistic<
		State & { __isExecuting__: boolean },
		Partial<State>
	>({ ...defaultOptState, __isExecuting__: false }, (state, newState) => ({
		...state,
		...(newState ?? {}),
		__isExecuting__: true,
	}));

	const executor = useRef(clientCaller);
	const [res, setRes] = useState<HookRes<IV, Data>>({});

	const { hasExecuted, hasSucceded, hasErrored } = getActionStatus<IV, Data>(res);

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

	const reset = useCallback(() => {
		setRes({});
	}, []);

	useActionCallbacks(res, hasSucceded, hasErrored, reset, cb);

	const { __isExecuting__, ...optimisticState } = optState;

	return {
		execute,
		isExecuting: __isExecuting__,
		res,
		optimisticState,
		reset,
		hasExecuted,
		hasSucceded,
		hasErrored,
	};
};
