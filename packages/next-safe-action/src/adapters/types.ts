import type { GenericSchema, GenericSchemaAsync, InferInput, InferOutput } from "valibot";
import type { z } from "zod";

export type Exists<T> = any extends T ? never : T;

export type Schema = Exists<z.ZodType> | Exists<GenericSchema> | Exists<GenericSchemaAsync>;
export type Infer<S extends Schema> =
	S extends Exists<z.ZodType>
		? z.infer<S>
		: S extends Exists<GenericSchema>
			? InferOutput<S>
			: S extends Exists<GenericSchemaAsync>
				? InferOutput<S>
				: never;
export type InferIn<S extends Schema> =
	S extends Exists<z.ZodType>
		? z.input<S>
		: S extends Exists<GenericSchema>
			? InferInput<S>
			: S extends Exists<GenericSchemaAsync>
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
	// generic
	validate<S extends Schema>(
		schema: S,
		data: unknown
	): Promise<{ success: true; data: Infer<S> } | { success: false; issues: ValidationIssue[] }>;
	// zod
	validate<S extends z.ZodType>(
		schema: S,
		data: unknown
	): Promise<{ success: true; data: Infer<S> } | { success: false; issues: ValidationIssue[] }>;
	// valibot
	validate<S extends GenericSchema | GenericSchemaAsync>(
		schema: S,
		data: unknown
	): Promise<{ success: true; data: Infer<S> } | { success: false; issues: ValidationIssue[] }>;
}
