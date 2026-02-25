import { unstable_cache } from "next/cache";

export const REVALIDATION_CALLBACKS_TAG = "playground-revalidation-callbacks";

export type RevalidationKind = "revalidatePath" | "revalidateTag";

type RevalidationDemoState = {
	mutationCount: number;
	pathRevalidationCount: number;
	tagRevalidationCount: number;
	lastMutationKind: RevalidationKind | null;
	lastMutationAt: string | null;
};

let state: RevalidationDemoState = {
	mutationCount: 0,
	pathRevalidationCount: 0,
	tagRevalidationCount: 0,
	lastMutationKind: null,
	lastMutationAt: null,
};

const getTaggedSnapshotCached = unstable_cache(
	async () => {
		return {
			...state,
			cachedAt: new Date().toISOString(),
		};
	},
	["playground-revalidation-callbacks-tagged-snapshot"],
	{
		tags: [REVALIDATION_CALLBACKS_TAG],
	}
);

export function mutateRevalidationCallbacksState(kind: RevalidationKind) {
	state = {
		...state,
		mutationCount: state.mutationCount + 1,
		pathRevalidationCount: state.pathRevalidationCount + (kind === "revalidatePath" ? 1 : 0),
		tagRevalidationCount: state.tagRevalidationCount + (kind === "revalidateTag" ? 1 : 0),
		lastMutationKind: kind,
		lastMutationAt: new Date().toISOString(),
	};

	return { ...state };
}

export async function getRevalidationCallbacksLiveSnapshot() {
	return {
		...state,
		readAt: new Date().toISOString(),
	};
}

export async function getRevalidationCallbacksTaggedSnapshot() {
	return getTaggedSnapshotCached();
}

