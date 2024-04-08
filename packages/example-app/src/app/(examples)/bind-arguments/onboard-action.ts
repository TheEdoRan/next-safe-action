"use server";

import { action } from "@/lib/safe-action";
import { z } from "zod";

const schema = z.object({
	username: z.string().min(3).max(30),
});

export const onboardUser = action
	.metadata({ actionName: "deleteUser" })
	.schema(schema)
	.bindArgsSchemas<[userId: z.ZodString, age: z.ZodNumber]>([
		z.string().uuid(),
		z.number().min(18).max(150),
	])
	.define(
		async ({
			parsedInput: { username },
			bindArgsParsedInputs: [userId, age],
		}) => {
			await new Promise((res) => setTimeout(res, 1000));

			return {
				message: `Welcome on board, ${username}! (age = ${age}, user id = ${userId})`,
			};
		}
	);
