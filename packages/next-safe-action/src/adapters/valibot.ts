// Code based on https://github.com/decs/typeschema/blob/main/packages/valibot/src/validation.ts

// MIT License

// Copyright (c) 2023 André Costa

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { getDotPath, safeParseAsync, type GenericSchema, type GenericSchemaAsync } from "valibot";
import type { IfInstalled, Infer, ValidationAdapter } from "./types";

class ValibotAdapter implements ValidationAdapter {
	async validate<S extends IfInstalled<GenericSchema | GenericSchemaAsync>>(schema: S, data: unknown) {
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
