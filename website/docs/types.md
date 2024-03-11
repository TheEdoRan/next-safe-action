---
sidebar_position: 7 
description: List of next-safe-action types.
---

# Types

## /

### `SafeClientOpts`

Type of options when creating a new safe action client.

```typescript
export type SafeClientOpts<Context, MiddlewareData> = {
  handleServerErrorLog?: (e: Error) => MaybePromise<void>;
  handleReturnedServerError?: (e: Error) => MaybePromise<string>;
  middleware?: (parsedInput: any, data?: MiddlewareData) => MaybePromise<Context>;
};
```

### `SafeAction`

Type of the function called from Client Components with typesafe input data.

```typescript
type SafeAction<S extends Schema, Data> = (input: InferIn<S>) => Promise<{
  data?: Data;
  serverError?: string;
  validationErrors?: Partial<Record<keyof Infer<S> | "_root", string[]>>;
}>;
```

### `ServerCodeFn`

Type of the function that executes server code when defining a new safe action.

```typescript
type ServerCodeFn<S extends Schema, Data, Context> = (
  parsedInput: Infer<S>,
  ctx: Context
) => Promise<Data>;
```

### `ValidationErrors`

Type of the returned object when input validation fails.

```typescript
export type ValidationErrors<S extends Schema> = Extend<ErrorList & SchemaErrors<Infer<S>>>;
```

## /hooks

### `HookResult`

Type of `result` object returned by `useAction` and `useOptimisticAction` hooks.

If a server-client communication error occurs, `fetchError` will be set to the error message.

```typescript
type HookResult<S extends Schema, Data> = Awaited<ReturnType<SafeAction<S, Data>>> & {
  fetchError?: string;
};
```

### `HookCallbacks`

Type of hooks callbacks. These are executed when action is in a specific state.

```typescript
type HookCallbacks<S extends Schema, Data> = {
  onExecute?: (input: InferIn<S>) => MaybePromise<void>;
  onSuccess?: (data: Data, input: InferIn<S>, reset: () => void) => MaybePromise<void>;
  onError?: (
    error: Omit<HookResult<S, Data>, "data">,
    input: InferIn<S>,
    reset: () => void
  ) => MaybePromise<void>;
  onSettled?: (
    result: HookResult<S, Data>,
    input: InferIn<S>,
    reset: () => void
  ) => MaybePromise<void>;
};
```

### `HookActionStatus`

Type of the action status returned by `useAction` and `useOptimisticAction` hooks.

```typescript
type HookActionStatus = "idle" | "executing" | "hasSucceeded" | "hasErrored";
```

---

## Utility types

### `MaybePromise`

Returns type or promise of type.

```typescript
export type MaybePromise<T> = Promise<T> | T;
```

### `Extend`

Extends an object without printing "&".

```typescript
export type Extend<S> = S extends infer U ? { [K in keyof U]: U[K] } : never;
```

### `ErrorList`

Object with an optional list of validation errors. Used in [`ValidationErrors`](#validationerrors) type.

```typescript
export type ErrorList = { _errors?: string[] } & {};
```

### `SchemaErrors`

Creates nested schema validation errors type using recursion. Used in [`ValidationErrors`](#validationerrors) type.

```typescript
export type SchemaErrors<S> = {
  [K in keyof S]?: S[K] extends object | null | undefined
    ? Extend<ErrorList & SchemaErrors<S[K]>>
    : ErrorList;
} & {};
```

---

## TypeSchema library

`Infer`, `InferIn`, `Schema` types come from [TypeSchema](https://typeschema.com/#types) library.
