// Code based on https://github.com/decs/typeschema/blob/main/packages/yup/src/validation.ts

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
							path: path && path.length > 0 ? path.split(".") : undefined,
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
