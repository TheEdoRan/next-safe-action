import type { z } from "zod";

// ********************* TYPES *********************

/**
 * The function called from Client Components with typesafe input data for the Server Action.
 */
export type ClientCaller<IV extends z.ZodTypeAny, AO> = (input: z.input<IV>) => Promise<{
	data?: AO;
	serverError?: true;
	validationError?: Partial<Record<keyof z.input<IV>, string[]>>;
}>;

/**
 * Action initializer overload, because some actions need authentication and others don't.
 * 1. If you don't need authentication, just pass `input` (Zod input validator) to `opts`.
 * You'll receive the parsed input as Server Action function definition parameter.
 * {@link https://github.com/theedoran/next-safe-action#1-the-direct-way See an example}.
 * 2. If you need authentication, you have to pass `withAuth: true`,
 * along with `input` (Zod input validator) when you're creating a new action.
 * In this case, you receive both the parsed input and auth data as
 * Server Action function definition parameters.
 * {@link https://github.com/theedoran/next-safe-action#authenticated-action See an example}.
 */
export type ActionOverload<AuthData extends object> = {
	<const IV extends z.ZodTypeAny, const AO>(
		opts: {
			input: IV;
			withAuth?: false;
		},
		actionDefinition: (parsedInput: z.input<IV>, authData: undefined) => Promise<AO>
	): ClientCaller<IV, AO>;

	<const IV extends z.ZodTypeAny, const AO>(
		opts: {
			input: IV;
			withAuth: true;
		},
		actionDefinition: (parsedInput: z.input<IV>, authData: AuthData) => Promise<AO>
	): ClientCaller<IV, AO>;
};

// ********************* FUNCTIONS *********************

/**
 * This is the safe action initializer.
 * @param createOpts Options for creating a new action client.
 * @returns {Function} A function that creates a new action, to be used in server files.
 *
 * {@link https://github.com/theedoran/next-safe-action#project-configuration See an example}
 */
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

	// `action` is the server function that creates a new action.
	// It expects an input validator, a optional `withAuth` property, and a
	// definition function, so the action knows what to do on the server when
	// called by the client.
	// It returns a function callable by the client.
	const action: ActionOverload<AuthData> = (opts, actionDefinition) => {
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

	return action;
};
