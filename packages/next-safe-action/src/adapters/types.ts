// Code inspired by https://github.com/decs/typeschema
import type { InferType, Schema as YupSchema } from "yup";
import type { StandardSchemaV1 } from "./standard";

export type IfInstalled<T> = any extends T ? never : T;

export type Schema = StandardSchemaV1 | IfInstalled<YupSchema>;

export type Infer<S extends Schema> = S extends StandardSchemaV1
	? StandardSchemaV1.InferOutput<S>
	: S extends IfInstalled<YupSchema>
		? InferType<S>
		: never;

export type InferIn<S extends Schema> = S extends StandardSchemaV1
	? StandardSchemaV1.InferInput<S>
	: S extends IfInstalled<YupSchema>
		? InferType<S>
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
	// standard
	validate<S extends StandardSchemaV1>(
		schema: S,
		data: unknown
	): Promise<{ success: true; data: Infer<S> } | { success: false; issues: ValidationIssue[] }>;
	// yup
	validate<S extends IfInstalled<YupSchema>>(
		schema: S,
		data: unknown
	): Promise<{ success: true; data: Infer<S> } | { success: false; issues: ValidationIssue[] }>;
}
