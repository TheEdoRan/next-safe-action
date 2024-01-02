import type { Infer, Schema, ValidationIssue } from "@decs/typeschema";

export const isError = (error: any): error is Error => error instanceof Error;
export const DEFAULT_SERVER_ERROR = "Something went wrong while executing the operation";
export type MaybePromise<T> = Promise<T> | T;

export const buildValidationErrors = <const S extends Schema>(issues: ValidationIssue[]) => {
	const validationErrors = {} as Partial<Record<keyof Infer<S> | "_root", string[]>>;

	const appendIssue = (path: keyof Infer<S> | "_root", message: string) => {
		if (validationErrors[path]?.length) {
			validationErrors[path]!.push(message);
		} else {
			validationErrors[path] = [message];
		}
	};

	for (const issue of issues) {
		const paths = issue.path as (keyof Infer<S>)[] | undefined;

		if (paths?.length) {
			for (const path of paths) {
				appendIssue(path, issue.message);
			}
		} else {
			appendIssue("_root", issue.message);
		}
	}

	return validationErrors;
};
