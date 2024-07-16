import type { z } from "zod";

export type Schema = z.ZodType;
export type Infer<S extends Schema> = S extends z.ZodType ? z.infer<S> : never;
export type InferIn<S extends Schema> = S extends z.ZodType ? z.input<S> : never;
export type InferArray<BAS extends readonly Schema[]> = {
	[K in keyof BAS]: Infer<BAS[K]>;
};
export type InferInArray<BAS extends readonly Schema[]> = {
	[K in keyof BAS]: InferIn<BAS[K]>;
};

export type ValidationIssue = {
	message: string;
	path?: Array<string | number | symbol>;
};

export interface ValidationAdapter<S extends Schema> {
	validate(
		schema: S,
		data: unknown
	): Promise<{ success: true; data: Infer<S> } | { success: false; issues: ValidationIssue[] }>;
}
