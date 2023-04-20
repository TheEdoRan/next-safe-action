import { useCallback, useRef, useState } from "react";
import type { z } from "zod";
import type { createMutationOutputValidator } from "..";
import type { ClientMutation } from "../types";

export const useMutation = <
	IV extends z.ZodTypeAny,
	OV extends ReturnType<typeof createMutationOutputValidator>
>(
	mutationFunction: ClientMutation<IV, OV>
) => {
	const mutation = useRef(mutationFunction);
	const [isMutating, setIsMutating] = useState(false);
	const [res, setRes] = useState<
		(Awaited<ReturnType<typeof mutationFunction>> & { fetchError?: any }) | null
	>(null);

	const mutate = useCallback(async (input: z.infer<IV>) => {
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

	return {
		mutate,
		isMutating,
		res,
	};
};
