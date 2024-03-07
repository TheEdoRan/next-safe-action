"use server";

type PrevState = {
	message: string;
};

// Temporary implementation.
export const signupAction = (prevState: PrevState, formData: FormData) => {
	return {
		message: "Logged in successfully!",
	};
};
