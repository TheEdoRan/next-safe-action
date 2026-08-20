"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { action } from "@/lib/safe-action";

const schema = zfd.formData({
	name: zfd.text(z.string().min(1).max(20)),
});

// Deliberately slow: the point of this action is to leave a wide window in which the hook
// must report `executing`/`isPending` while React holds the form-action transition open.
const DELAY_MS = 1500;

export const formActionStatusAction = action
	.metadata({ actionName: "formActionStatusAction" })
	.inputSchema(schema)
	.action(async ({ parsedInput }) => {
		await new Promise((res) => setTimeout(res, DELAY_MS));
		return { greeted: parsedInput.name };
	});

export const formActionStatusStateAction = action
	.metadata({ actionName: "formActionStatusStateAction" })
	.inputSchema(schema)
	.stateAction(async ({ parsedInput }) => {
		await new Promise((res) => setTimeout(res, DELAY_MS));
		return { greeted: parsedInput.name };
	});
