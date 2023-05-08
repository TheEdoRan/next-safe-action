import type { z } from "zod";
import type { SafeActionOverload } from "./types";

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
			const parsedInput = opts.input.safeParse(input);

			if (!parsedInput.success) {
				const fieldErrors = parsedInput.error.flatten().fieldErrors as Partial<
					Record<keyof z.input<(typeof opts)["input"]>, string[]>
				>;

				return {
					validationError: fieldErrors,
				};
			}

			try {
				let serverRes;

				if (opts.withAuth) {
					if (!createOpts?.getAuthData) {
						throw new Error("`getAuthData` function not provided to `createSafeActionClient`");
					}

					const authData = await createOpts.getAuthData();

					// @ts-expect-error
					serverRes = await actionDefinition(parsedInput.data, authData);
				} else {
					// @ts-expect-error
					serverRes = await actionDefinition(parsedInput.data);
				}

				return { data: serverRes };
			} catch (e: any) {
				// eslint-disable-next-line
				serverErrorLogFunction(e);

				return { serverError: true };
			}
		};
	};

	return safeAction;
};
