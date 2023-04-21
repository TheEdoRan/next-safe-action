import { z } from "zod";
import { createSafeMutationClient } from ".";

const safeMutation = createSafeMutationClient();

const getData = safeMutation({ input: z.object({ hi: z.string() }) }, async ({ hi }) => {
	if (Date.now() > 12031203) {
		return {
			type: "fail",
			data: {
				reason: "asd",
				what: "thef",
			},
		};
	}

	if (Date.now() > 12031208) {
		return {
			type: "success",
			data: {
				allgood: true,
			},
		};
	}

	return {
		type: "fail",
		data: {
			reason: "ohno",
		},
	};
});

const main = async () => {
	const res = await getData({ hi: "hello" });
};
