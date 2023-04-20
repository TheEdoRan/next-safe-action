import { z } from "zod";
import type { SafeMutationOverload } from "./types";

const successOutput = <SuccessData extends z.AnyZodObject>(successData: SuccessData) => {
	return z.object({ type: z.literal("success"), data: successData });
};

const successOrErrorOutput = <SuccessData extends z.AnyZodObject, ErrorData extends z.AnyZodObject>(
	successData: SuccessData,
	errorData: ErrorData
) => {
	return successOutput(successData).or(z.object({ type: z.literal("error"), data: errorData }));
};

export function createMutationOutputValidator<SuccessData extends z.AnyZodObject>(data: {
	successData: SuccessData;
	errorData?: undefined;
}): ReturnType<typeof successOutput<SuccessData>>;

export function createMutationOutputValidator<
	SuccessData extends z.AnyZodObject,
	ErrorData extends z.AnyZodObject
>(data: {
	successData: SuccessData;
	errorData: ErrorData;
}): ReturnType<typeof successOrErrorOutput<SuccessData, ErrorData>>;

// This utility creates an output validator that has
// { type: "success", data: successData }
// or
// { type: "error", data: errorData } (if `errorData` is provided, otherwise undefined).
export function createMutationOutputValidator<
	SuccessData extends z.AnyZodObject,
	ErrorData extends z.AnyZodObject
>(data: { successData: SuccessData; errorData?: ErrorData | undefined }) {
	if (typeof data.errorData !== "undefined") {
		return successOrErrorOutput(data.successData, data.errorData);
	}

	return successOutput(data.successData);
}

// This is the safe mutation initializer.
export const createSafeMutationClient = <AuthData extends object>(createOpts?: {
	serverErrorLogFunction?: (e: any) => void | Promise<void>;
	getAuthData?: () => Promise<AuthData>;
}) => {
	// If log function is not provided, default to `console.error` for logging
	// server error messages.
	const serverErrorLogFunction =
		createOpts?.serverErrorLogFunction ||
		((e) => {
			const errMessage = "message" in e && typeof e.message === "string" ? e.message : e;

			console.log("Mutation error:", errMessage);
		});

	// `safeMutation` is the server function that creates a new mutation.
	// It expects input and output validators, an optional `withAuth` property, and
	// a definition function, so the mutation knows what to do on the server when
	// called by the client.
	// It returns a function callable by the client.
	const safeMutation: SafeMutationOverload<AuthData> = (opts, mutationDefinitionFunc) => {
		// This is the function called by client. If `input` fails the `inputValidator`
		// parsing, the function will return an `inputValidationError` object,
		// containing all the invalid fields provided.
		return async (input) => {
			const parsedInput = opts.inputValidator.safeParse(input);

			if (!parsedInput.success) {
				const fieldErrors = parsedInput.error.flatten().fieldErrors as Partial<
					Record<keyof z.infer<(typeof opts)["inputValidator"]>, string[]>
				>;

				return {
					inputValidationError: fieldErrors,
				};
			}

			try {
				let serverRes: z.infer<(typeof opts)["outputValidator"]>;

				if (opts.withAuth) {
					if (!createOpts?.getAuthData) {
						throw new Error("`getAuthData` function not provided to `createSafeMutationClient`");
					}

					const authData = await createOpts.getAuthData();

					// @ts-expect-error
					serverRes = await mutationDefinitionFunc(parsedInput.data, authData);
				} else {
					// @ts-expect-error
					serverRes = await mutationDefinitionFunc(parsedInput.data);
				}

				const parsedOutput = opts.outputValidator.safeParse(serverRes);

				if (!parsedOutput.success) {
					throw new Error("output parsing risulted in invalid object");
				}

				return {
					[serverRes.type]: serverRes.data,
				};
			} catch (e: any) {
				// eslint-disable-next-line
				serverErrorLogFunction(e);

				return { serverError: true };
			}
		};
	};

	return safeMutation;
};
