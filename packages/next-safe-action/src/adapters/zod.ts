import type { z } from "zod";
import type { IfInstalled, Infer, ValidationAdapter } from "./types";

export type ZodSchema = z.ZodType;

class ZodAdapter implements ValidationAdapter {
	async validate<S extends IfInstalled<z.ZodType>>(schema: S, data: unknown) {
		const result = await schema.safeParseAsync(data);

		if (result.success) {
			return {
				success: true,
				data: result.data as Infer<S>,
			} as const;
		}

		return {
			success: false,
			issues: result.error.issues.map(({ message, path }) => ({ message, path })),
		} as const;
	}
}

export function zodAdapter() {
	return new ZodAdapter();
}
