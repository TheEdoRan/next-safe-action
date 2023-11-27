---
sidebar_position: 7 
description: List of exported types.
---

# Types

### `SafeAction`

Type of the function called from Client Components with typesafe input data.

```typescript
type SafeAction<Schema extends z.ZodTypeAny, Data> = (input: z.input<Schema>) => Promise<{
  data?: Data;
  serverError?: string;
  validationError?: Partial<Record<keyof z.input<Schema> | "_root", string[]>>;
}>;
```

### `ServerCode`

Type of the function that executes server code when defining a new safe action.

```typescript
type ServerCode<Schema extends z.ZodTypeAny, Data, Context> = (
  parsedInput: z.infer<Schema>,
  ctx: Context
) => Promise<Data>;
```

### `HookResult`

Type of `result` object returned by `useAction` and `useOptimisticAction` hooks.

If a server-client communication error occurs, `fetchError` will be set to the error message.

```typescript
type HookResult<Schema extends z.ZodTypeAny, Data> = Awaited<
  ReturnType<SafeAction<Schema, Data>>
> & {
  fetchError?: string;
};
```

### `HookCallbacks`

Type of hooks callbacks. These are executed when action is in a specific state.

```typescript
type HookCallbacks<Schema extends z.ZodTypeAny, Data> = {
  onExecute?: (input: z.input<Schema>) => MaybePromise<void>;
  onSuccess?: (data: Data, input: z.input<Schema>, reset: () => void) => MaybePromise<void>;
  onError?: (
    error: Omit<HookResult<Schema, Data>, "data">,
    input: z.input<Schema>,
    reset: () => void
  ) => MaybePromise<void>;
  onSettled?: (
    result: HookResult<Schema, Data>,
    input: z.input<Schema>,
    reset: () => void
  ) => MaybePromise<void>;
};
```

### `HookActionStatus`

Type of the action status returned by `useAction` and `useOptimisticAction` hooks.

```typescript
type HookActionStatus = "idle" | "executing" | "hasSucceeded" | "hasErrored";
```