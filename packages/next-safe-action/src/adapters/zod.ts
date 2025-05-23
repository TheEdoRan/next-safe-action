// Code based on https://github.com/decs/typeschema/blob/main/packages/zod/src/validation.ts

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

import type { z } from "zod";
import type { IfInstalled, Infer, ValidationAdapter } from "./types";

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
			// @ts-expect-error
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			issues: result.error.issues.map(({ message, path, unionErrors }) => ({ message, path, unionErrors })),
		} as const;
	}
}

export function zodAdapter() {
	return new ZodAdapter();
}
