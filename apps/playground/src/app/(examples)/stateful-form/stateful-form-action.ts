"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { action } from "@/lib/safe-action";

const schema = zfd.formData({
	name: zfd.text(z.string().min(1).max(20)),
});

// Note that we need to explicitly give a type to `stateAction` here, for its return object.
// This is because TypeScript can't infer the return type of the function and then "pass it" to
// the second argument of the server code function (`prevResult`). If you don't need to access `prevResult`,
// though, you can omit the type here, since it will be inferred just like with `action` method.
export const statefulFormAction = action
	.metadata({ actionName: "statefulFormAction" })
	.inputSchema(schema)
	.stateAction<{
		prevName?: string;
		newName: string;
	}>(async ({ parsedInput }, { prevResult }) => {
		await new Promise((res) => setTimeout(res, 1000));

		return {
			prevName: prevResult.data?.newName,
			newName: parsedInput.name,
		};
	});
