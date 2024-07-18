import { getDotPath, safeParseAsync, type GenericSchema, type GenericSchemaAsync } from "valibot";
import type { Infer, ValidationAdapter } from "./types";

class ValibotAdapter implements ValidationAdapter {
	async validate<S extends GenericSchema | GenericSchemaAsync>(schema: S, data: unknown) {
		const result = await safeParseAsync(schema, data);

		if (result.success) {
			return {
				success: true,
				data: result.output as Infer<S>,
			} as const;
		}

		return {
			success: false,
			issues: result.issues.map((issue) => ({
				message: issue.message,
				path: getDotPath(issue)?.split("."),
			})),
		} as const;
	}
}

export function valibotAdapter() {
	return new ValibotAdapter();
}
