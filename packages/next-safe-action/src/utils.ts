import type { MiddlewareFn } from "./index.types";

export const DEFAULT_SERVER_ERROR_MESSAGE = "Something went wrong while executing the operation.";

export const isError = (error: unknown): error is Error => error instanceof Error;

export const deepMerge = (obj1: object, obj2: object) => {
	for (const key of Object.keys(obj2)) {
		const k = key as keyof typeof obj2;
		// eslint-disable-next-line
		if (typeof obj2[k] === "object" && Object.hasOwn(obj1, k)) {
			// @ts-expect-error
			if (!obj1[k]) obj1[k] = {};
			deepMerge(obj1[k], obj2[k]);
		} else {
			obj1[k] = obj2[k];
		}
	}

	return obj1;
};

/**
 * This error is thrown when an action's metadata input is invalid, i.e. when there's a mismatch between the
 * type of the metadata schema returned from `defineMetadataSchema` and the actual input.
 */
export class ActionMetadataError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ActionMetadataError";
	}
}

/**
 * Creates a standalone middleware function. It accepts a generic object with optional `serverError`, `ctx` and `metadata`
 * properties, if you need one or all of them to be typed. The type for each property that is passed as generic is the
 * **minimum** shape required to define the middleware function, but it can also be larger than that.
 *
 * {@link https://next-safe-action.dev/docs/safe-action-client/middleware#create-standalone-middleware-with-createmiddleware See docs for more information}
 */
export const createMiddleware = <BaseData extends { serverError?: any; ctx?: object; metadata?: any }>() => {
	return {
		define: <NextCtx extends object>(
			middlewareFn: MiddlewareFn<
				BaseData extends { serverError: infer SE } ? SE : any,
				BaseData extends { metadata: infer MD } ? MD : any,
				BaseData extends { ctx: infer Ctx extends object } ? Ctx : object,
				NextCtx
			>
		) => middlewareFn,
	};
};
