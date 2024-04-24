import { z } from "zod";

export const schema = z.object({
	productId: z.string().min(1),
});
