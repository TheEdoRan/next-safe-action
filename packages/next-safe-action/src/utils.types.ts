// Takes an object type and makes it more readable.
export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

// Returns type or promise of type.
export type MaybePromise<T> = Promise<T> | T;

// Returns type or array of type.
export type MaybeArray<T> = T | T[];
