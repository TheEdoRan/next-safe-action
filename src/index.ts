import type { z } from "zod";

/*********************** TYPES ***********************/

// The type for client action, which is called by components.
// You pass the input data here, and it's all typesafe.
export type ClientAction<IV extends z.ZodTypeAny, AO> = (input: z.input<IV>) => Promise<{
	data?: AO;
	serverError?: true;
	validationError?: Partial<Record<keyof z.input<IV>, string[]>>;
}>;

// We need to overload the `safeAction` function, because some actions
// need authentication, and others don't, so you can pass the `withAuth: true` property
// in the `opts` arg, to get back both `parsedInput` and `authArgs` in the server
// action function definition.
// `authArgs` comes from the previously defined `getAuthData` function.
export type SafeActionOverload<AuthData extends object> = {
	<const IV extends z.ZodTypeAny, const AO>(
		opts: {
			input: IV;
			withAuth?: false;
		},
		actionDefinition: (parsedInput: z.input<IV>, authArgs: undefined) => Promise<AO>
	): ClientAction<IV, AO>;

	<const IV extends z.ZodTypeAny, const AO>(
		opts: {
			input: IV;
			withAuth: true;
		},
		actionDefinition: (parsedInput: z.input<IV>, authArgs: AuthData) => Promise<AO>
	): ClientAction<IV, AO>;
};

/*********************** FUNCTIONS ***********************/

// This is the safe action initializer.
export const createSafeActionClient = <AuthData extends object>(createOpts?: {
	serverErrorLogFunction?: (e: any) => void | Promise<void>;
	getAuthData?: () => Promise<AuthData>;
}) => {
	// If log function is not provided, default to `console.error` for logging
	// server error messages.
	const serverErrorLogFunction =
		createOpts?.serverErrorLogFunction ||
		((e) => {
			const errMessage = "message" in e && typeof e.message === "string" ? e.message : e;

			console.log("Action error:", errMessage);
		});

	// `safeAction` is the server function that creates a new action.
	// It expects an input validator, a optional `withAuth` property, and a
	// definition function, so the action knows what to do on the server when
	// called by the client.
	// It returns a function callable by the client.
	const safeAction: SafeActionOverload<AuthData> = (opts, actionDefinition) => {
		// This is the function called by client. If `input` fails the validator
		// parsing, the function will return a `validationError` object, containing
		// all the invalid fields provided.
		return async (input) => {
			try {
				let authData: Awaited<AuthData> | undefined = undefined;

				if (opts.withAuth) {
					if (!createOpts?.getAuthData) {
						throw new Error("`getAuthData` function not provided to `createSafeActionClient`");
					}

					authData = await createOpts.getAuthData();
				}

				const parsedInput = opts.input.safeParse(input);

				if (!parsedInput.success) {
					const fieldErrors = parsedInput.error.flatten().fieldErrors as Partial<
						Record<keyof z.input<(typeof opts)["input"]>, string[]>
					>;

					return {
						validationError: fieldErrors,
					};
				}

				// @ts-expect-error
				return { data: await actionDefinition(parsedInput.data, authData) };
			} catch (e: any) {
				// eslint-disable-next-line
				serverErrorLogFunction(e);

				return { serverError: true };
			}
		};
	};

	return safeAction;
};
