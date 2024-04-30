"use server";

import { action } from "@/lib/safe-action";
import { z } from "zod";
import { zfd } from "zod-form-data";

const schema = zfd.formData({
	num: zfd.numeric(z.number().min(1).max(90)),
});

export const lotteryAction = action
	.schema(schema)
	.stateAction<{ nums: number[] }>(async ({ parsedInput }, { prevResult }) => {
		await new Promise((res) => setTimeout(res, 1000));

		const prevNums = prevResult.data?.nums ?? [];

		return {
			nums: [...prevNums, parsedInput.num],
		};
	});
