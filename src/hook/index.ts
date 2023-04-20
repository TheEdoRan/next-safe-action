import { useCallback, useRef, useState } from "react";
import type { z } from "zod";
import type { createMutationOutputValidator } from "..";
import type { ClientMutation } from "../types";

export const useMutation = <
	IV extends z.ZodTypeAny,
	OV extends ReturnType<typeof createMutationOutputValidator>,
	K extends string
>(
	mutationFunction: ClientMutation<IV, OV>,
	key: K
) => {
	const mutation = useRef(mutationFunction);
	const [isMutating, setIsMutating] = useState(false);
	const [res, setRes] = useState<
		(Awaited<ReturnType<typeof mutationFunction>> & { fetchError?: any }) | null
	>(null);

	const mutate = useCallback(async (input: z.infer<IV>) => {
		setRes(null);
		setIsMutating(true);

		try {
			const r = await mutation.current(input);
			setRes(r);
		} catch (e) {
			// If fetch fails.
			setRes({ fetchError: e });
		}

		setIsMutating(false);
	}, []);

	type Ret = {
		[key in K]: {
			mutate: typeof mutate;
			isMutating: typeof isMutating;
			res: typeof res;
		};
	};

	return {
		[key]: {
			mutate,
			isMutating,
			res,
		},
	} as Ret;
};
