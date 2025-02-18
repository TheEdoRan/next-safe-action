import type { StandardSchemaV1 } from "./standard.types";

// for simplicity, make sure we always get a promise
// like the adapters did
export async function parseWithSchema<Output>(schema: StandardSchemaV1<unknown, Output>, value: unknown) {
	return schema["~standard"].validate(value);
}
