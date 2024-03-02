"use server";

import { action } from "@/lib/safe-action";
import z from "zod";
import { zfd } from "zod-form-data";

const schema = zfd.formData({
	email: zfd.text(z.string().email()),
	password: zfd.text(z.string().min(8)),
});

export const signup = action(schema, async ({ email, password }) => {
	console.log("Email:", email, "Password:", password);
	return {
		success: true,
	};
});
