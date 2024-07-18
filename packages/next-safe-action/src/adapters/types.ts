import type { GenericSchema, GenericSchemaAsync, InferInput, InferOutput } from "valibot";
import type { z } from "zod";

export type Schema = z.ZodType | GenericSchema | GenericSchemaAsync;
export type Infer<S extends Schema> = S extends z.ZodType
	? z.infer<S>
	: S extends GenericSchema
		? InferOutput<S>
		: S extends GenericSchemaAsync
			? InferOutput<S>
			: never;
export type InferIn<S extends Schema> = S extends z.ZodType
	? z.input<S>
	: S extends GenericSchema
		? InferInput<S>
		: S extends GenericSchemaAsync
			? InferInput<S>
			: never;
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

export interface ValidationAdapter {
	// zod
	validate<S extends z.ZodType>(
		schema: S,
		data: unknown
	): Promise<{ success: true; data: Infer<S> } | { success: false; issues: ValidationIssue[] }>;
	// valibot
	validate<S extends GenericSchema>(
		schema: S,
		data: unknown
	): Promise<{ success: true; data: Infer<S> } | { success: false; issues: ValidationIssue[] }>;
	// valibot
	validate<S extends GenericSchemaAsync>(
		schema: S,
		data: unknown
	): Promise<{ success: true; data: Infer<S> } | { success: false; issues: ValidationIssue[] }>;
}
