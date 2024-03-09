---
sidebar_position: 7 
description: List of exported types.
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

## TypeSchema library

`Infer`, `InferIn`, `Schema` types come from [TypeSchema](https://typeschema.com/#types) library.