"use server";

import { action } from "@/lib/safe-action";
import { zfd } from "zod-form-data";

const schema = zfd.formData({
	email: zfd.text(),
	password: zfd.text(),
});

export const signup = action(schema, async ({ email, password }) => {
	console.log("Email:", email, "Password:", password);
	return {
		success: true,
	};
});
