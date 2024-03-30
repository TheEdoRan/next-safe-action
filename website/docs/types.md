---
sidebar_position: 7 
description: List of next-safe-action types.
---

# Types

## /

### `SafeActionClientOpts`

Type of options when creating a new safe action client.

```typescript
export type SafeActionClientOpts = {
  handleServerErrorLog?: (e: Error) => MaybePromise<void>;
  handleReturnedServerError?: (e: Error) => MaybePromise<string>;
};
```

### `SafeActionResult`

Type of the result of a safe action.

```typescript
export type SafeActionResult<S extends Schema, Data, NextCtx = unknown> = {
  data?: Data;
  serverError?: string;
  validationErrors?: ValidationErrors<S>;
};
```

### `SafeAction`

Type of the function called from components with typesafe input data.

```typescript
export type SafeAction<S extends Schema, Data> = (
  input: InferIn<S>
) => Promise<SafeActionResult<S, Data>>;
```

### `MiddlewareResult`

Type of the result of a middleware function. It extends the result of a safe action with `parsedInput` and `ctx` optional properties.

```typescript
export type MiddlewareResult<NextCtx> = SafeActionResult<any, unknown, NextCtx> & {
  parsedInput?: unknown;
  ctx?: unknown;
  success: boolean;
};
```

### `ActionMetadata`

Type of meta options to be passed when defining a new safe action.

```typescript
export type ActionMetadata = {
  actionName?: string;
};
```

### `MiddlewareFn`

Type of the middleware function passed to a safe action client.

```typescript
export type MiddlewareFn<ClientInput, Ctx, NextCtx> = {
  (opts: {
    clientInput: ClientInput;
    ctx: Ctx;
    metadata: ActionMetadata;
    next: {
      <const NC>(opts: { ctx: NC }): Promise<MiddlewareResult<NC>>;
    };
  }): Promise<MiddlewareResult<NextCtx>>;
};
```

### `ServerCodeFn`

Type of the function that executes server code when defining a new safe action.

```typescript
export type ServerCodeFn<S extends Schema, Data, Context> = (
  parsedInput: Infer<S>,
  utils: { ctx: Context; metadata: ActionMetadata }
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

`Infer`, `InferIn`, `Schema` types come from [TypeSchema](https://typeschema.com) library.
