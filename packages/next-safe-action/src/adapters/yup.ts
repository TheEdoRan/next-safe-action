// https://github.com/decs/typeschema/blob/main/packages/yup/src/validation.ts

import type { Schema as YupSchema } from "yup";
import { ValidationError } from "yup";
import type { IfInstalled, Infer, ValidationAdapter, ValidationIssue } from "./types";

class YupAdapter implements ValidationAdapter {
	async validate<S extends IfInstalled<YupSchema>>(schema: S, data: unknown) {
		try {
			const result = await schema.validate(data, { strict: true });

			return {
				success: true,
				data: result as Infer<S>,
			} as const;
		} catch (e) {
			if (e instanceof ValidationError) {
				const { message, path } = e;

				return {
					success: false,
					issues: [
						{
							message,
							path: path && path.length > 0 ? [path] : undefined,
						},
					] as ValidationIssue[],
				} as const;
			}

			throw e;
		}
	}
}

export function yupAdapter() {
	return new YupAdapter();
}
