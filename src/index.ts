import { z } from "zod";

type UndefinedKeys<T extends object> = {
	[key in keyof T]: undefined;
};

// This utility creates an output validator that has
// { type: "success", data: successData } or { type: "clientError", data: clientErrorData }
export const createMutationOutputValidator = <
	SuccessData extends z.AnyZodObject,
	ClientErrorData extends z.AnyZodObject
>({
	successData,
	clientErrorData,
}: {
	successData: SuccessData;
	clientErrorData: ClientErrorData;
}) =>
	z
		.object({ type: z.literal("success"), data: successData })
		.or(z.object({ type: z.literal("clientError"), data: clientErrorData }));

// The type for client mutation, which is called by components.
// You pass the input data here, and it's all typesafe.
type ClientMutation<
	IV extends z.ZodTypeAny,
	OV extends ReturnType<typeof createMutationOutputValidator>
> = (input: z.infer<IV>) => Promise<{
	success?: Extract<z.infer<OV>, { type: "success" }>["data"];
	clientError?: Extract<z.infer<OV>, { type: "clientError" }>["data"];
	serverError?: true;
	inputValidationErrorFields?: Partial<Record<keyof z.infer<IV>, string[]>>;
}>;

// eslint-disable-next-line
export interface AuthData {}

// We need to overload the `safeMutation` function, because some mutations
// need authentication, and others don't, so you can pass the `withAuth: true` property
// in the `opts` arg, to get back both `parsedInput` and `authArgs` in the server
// mutation function definition.
// `authArgs` comes from the previously defined `getAuthUserId` function.
type SafeMutationOverload = {
	<
		const IV extends z.ZodTypeAny,
		const OV extends ReturnType<typeof createMutationOutputValidator>
	>(
		opts: {
			inputValidator: IV;
			outputValidator: OV;
			withAuth?: false;
		},
		mutationDefinitionFunc: (
			parsedInput: z.infer<IV>,
			authArgs: UndefinedKeys<AuthData>
		) => Promise<z.infer<OV>>
	): ClientMutation<IV, OV>;

	<
		const IV extends z.ZodTypeAny,
		const OV extends ReturnType<typeof createMutationOutputValidator>
	>(
		opts: {
			inputValidator: IV;
			outputValidator: OV;
			withAuth: true;
		},
		mutationDefinitionFunc: (parsedInput: z.infer<IV>, authArgs: AuthData) => Promise<z.infer<OV>>
	): ClientMutation<IV, OV>;
};

type CreateSafeMutationClientArgs = {
	serverErrorLogFunction?: (e: any) => void | Promise<void>;
	getAuthData?: () => Promise<AuthData>;
};

// This is the safe mutation initializer.
export const createSafeMutationClient = (createOpts?: CreateSafeMutationClientArgs) => {
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
	const safeMutation: SafeMutationOverload = (opts, mutationDefinitionFunc) => {
		// This is the function called by client. If `input` fails the `inputValidator`
		// parsing, the function will return an `inputValidationErrorFields` object,
		// containing all the invalid fields provided.
		return async (input) => {
			const parsedInput = opts.inputValidator.safeParse(input);

			if (!parsedInput.success) {
				const fieldErrors = parsedInput.error.flatten().fieldErrors as Partial<
					Record<keyof z.infer<(typeof opts)["inputValidator"]>, string[]>
				>;

				return {
					inputValidationErrorFields: fieldErrors,
				};
			}

			try {
				let serverRes: z.infer<(typeof opts)["outputValidator"]>;

				if (opts.withAuth) {
					if (!createOpts?.getAuthData) {
						throw new Error("`getAuthData` function not provided to `createSafeMutationClient`");
					}

					const authData = await createOpts.getAuthData();
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

	return { safeMutation };
};
