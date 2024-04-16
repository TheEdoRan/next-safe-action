---
sidebar_position: 7 
description: List of next-safe-action types.
---

# Types

## /

### `SafeActionClientOpts`

Type of options when creating a new safe action client.

```typescript
export type SafeActionClientOpts<ServerError> = {
  handleServerErrorLog?: (e: Error) => MaybePromise<void>;
  handleReturnedServerError?: (e: Error) => MaybePromise<ServerError>;
};
```

### `SafeActionResult`

Type of the result of a safe action.

```typescript
export type SafeActionResult<
  ServerError,
  S extends Schema,
  BAS extends readonly Schema[],
  FVE = ValidationErrors<S>,
  FBAVE = BindArgsValidationErrors<BAS>,
  Data = null,
  NextCtx = unknown,
> = {
  data?: Data;
  serverError?: ServerError;
  validationErrors?: FVE;
  bindArgsValidationErrors?: FBAVE;
};
```

### `SafeActionFn`

Type of the function called from components with typesafe input data.

```typescript
export type SafeActionFn<
  ServerError,
  S extends Schema,
  BAS extends readonly Schema[],
  FVE,
  FBAVE,
  Data,
> = (
  ...clientInputs: [...InferInArray<BAS>, InferIn<S>]
) => Promise<SafeActionResult<ServerError, S, BAS, FVE, FBAVE, Data>>;
```

### `ActionMetadata`

Type of meta options to be passed when defining a new safe action.

```typescript
export type ActionMetadata = {
  actionName?: string;
};
```

### `MiddlewareResult`


Type of the result of a middleware function. It extends the result of a safe action with information about the action execution.

```typescript
export type MiddlewareResult<ServerError, NextCtx> = SafeActionResult<
  ServerError,
  any,
  any,
  any,
  any,
  unknown,
  NextCtx
> & {
  parsedInput?: unknown;
  bindArgsParsedInputs?: unknown[];
  ctx?: unknown;
  success: boolean;
};
```

### `MiddlewareFn`

Type of the middleware function passed to a safe action client.

```typescript
export type MiddlewareFn<ServerError, Ctx, NextCtx> = {
  (opts: {
    clientInput: unknown;
    bindArgsClientInputs: unknown[];
    ctx: Ctx;
    metadata: ActionMetadata;
    next: {
      <const NC>(opts: { ctx: NC }): Promise<MiddlewareResult<ServerError, NC>>;
    };
  }): Promise<MiddlewareResult<ServerError, NextCtx>>;
};
```

### `ServerCodeFn`

Type of the function that executes server code when defining a new safe action.

```typescript
export type ServerCodeFn<S extends Schema, BAS extends readonly Schema[], Data, Ctx> = (args: {
  parsedInput: Infer<S>;
  bindArgsParsedInputs: InferArray<BAS>;
  ctx: Ctx;
  metadata: ActionMetadata;
}) => Promise<Data>;
```

### `ValidationErrors`

Type of the returned object when input validation fails.

```typescript
export type ValidationErrors<S extends Schema> =
	Infer<S> extends object ? PrettyMerge<ErrorList & SchemaErrors<Infer<S>>> : ErrorList;
```

### `BindArgsValidationErrors`

Type of the array of validation errors of bind arguments.

```typescript
export type BindArgsValidationErrors<BAS extends readonly Schema[]> = {
	[K in keyof BAS]: ValidationErrors<BAS[K]>;
```

### `FlattenedValidationErrors`

Type of flattened validation errors. `formErrors` contains global errors, and `fieldErrors` contains errors for each field, one level deep.

```typescript
export type FlattenedValidationErrors<VE extends ValidationErrors<any>> = Prettify<{
	formErrors: string[];
	fieldErrors: {
		[K in keyof Omit<VE, "_errors">]?: string[];
	};
}>;
```

### `FlattenedBindArgsValidationErrors`

Type of flattened bind arguments validation errors.

```typescript
export type FlattenedBindArgsValidationErrors<BAVE extends readonly ValidationErrors<any>[]> = {
	[K in keyof BAVE]: FlattenedValidationErrors<BAVE[K]>;
};
```

### `FormatValidationErrorsFn`

Type of the function used to format validation errors.

```typescript
export type FormatValidationErrorsFn<S extends Schema, FVE> = (
	validationErrors: ValidationErrors<S>
) => FVE;
```

### `FormatBindArgsValidationErrorsFn`

Type of the function used to format bind arguments validation errors.

```typescript
export type FormatBindArgsValidationErrorsFn<BAS extends readonly Schema[], FBAVE> = (
	bindArgsValidationErrors: BindArgsValidationErrors<BAS>
) => FBAVE;
```

## /hooks

### `HookResult`

Type of `result` object returned by `useAction` and `useOptimisticAction` hooks.

If a server-client communication error occurs, `fetchError` will be set to the error message.

```typescript
export type HookResult<
	ServerError,
	S extends Schema,
	BAS extends readonly Schema[],
	FVE,
	FBAVE,
	Data,
> = SafeActionResult<ServerError, S, BAS, FVE, FBAVE, Data> & {
	fetchError?: string;
};

```

### `HookCallbacks`

Type of hooks callbacks. These are executed when action is in a specific state.

```typescript
export type HookCallbacks<
	ServerError,
	S extends Schema,
	BAS extends readonly Schema[],
	FVE,
	FBAVE,
	Data,
> = {
	onExecute?: (args: { input: InferIn<S> }) => MaybePromise<void>;
	onSuccess?: (args: { data: Data; input: InferIn<S>; reset: () => void }) => MaybePromise<void>;
	onError?: (args: {
		error: Omit<HookResult<ServerError, S, BAS, FVE, FBAVE, Data>, "data">;
		input: InferIn<S>;
		reset: () => void;
	}) => MaybePromise<void>;
	onSettled?: (args: {
		result: HookResult<ServerError, S, BAS, FVE, FBAVE, Data>;
		input: InferIn<S>;
		reset: () => void;
	}) => MaybePromise<void>;
};
```

### `HookSafeActionFn`

 Type of the safe action function passed to hooks. Same as `SafeActionFn` except it accepts just a single input, without bind arguments.

```typescript
export type HookSafeActionFn<
	ServerError,
	S extends Schema,
	BAS extends readonly Schema[],
	FVE,
	FBAVE,
	Data,
> = (clientInput: InferIn<S>) => Promise<SafeActionResult<ServerError, S, BAS, FVE, FBAVE, Data>>;
```

### `HookActionStatus`

Type of the action status returned by `useAction` and `useOptimisticAction` hooks.

```typescript
type HookActionStatus = "idle" | "executing" | "hasSucceeded" | "hasErrored";
```

---

## Utility types

### `Prettify`

Takes an object type and makes it more readable.

```typescript
export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};
```

### `MaybePromise`

Returns type or promise of type.

```typescript
export type MaybePromise<T> = Promise<T> | T;
```

### `InferArray`

Infers output schema type in array of schemas.

```typescript
export type InferArray<BAS extends readonly Schema[]> = {
  [K in keyof BAS]: Infer<BAS[K]>;
};
```

### `InferInArray`

Infers input schema type in array of schemas.

```typescript
export type InferInArray<BAS extends readonly Schema[]> = {
  [K in keyof BAS]: InferIn<BAS[K]>;
};
```

### `PrettyMerge`

Merges an object without printing "&".

```typescript
type PrettyMerge<S> = S extends infer U ? { [K in keyof U]: U[K] } : never;
```

### `ErrorList`

Object with an optional list of validation errors. Used in [`ValidationErrors`](#validationerrors) type.

```typescript
export type ErrorList = Prettify<{ _errors?: string[] }>;
```

### `SchemaErrors`

Creates nested schema validation errors type using recursion. Used in [`ValidationErrors`](#validationerrors) type.

```typescript
type SchemaErrors<S> = {
	[K in keyof S]?: S[K] extends object | null | undefined
		? PrettyMerge<ErrorList & SchemaErrors<S[K]>>
		: ErrorList;
} & {};
```

---

## TypeSchema library

`Infer`, `InferIn`, `Schema` types come from [TypeSchema](https://typeschema.com) library.
