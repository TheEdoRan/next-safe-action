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
export type SafeActionResult<ServerError, S extends Schema, BAS extends Schema[], Data, NextCtx = unknown> = {
  data?: Data;
  serverError?: ServerError;
  validationErrors?: ValidationErrors<S>;
  bindArgsValidationErrors?: BindArgsValidationErrors<BAS>;
};
```

### `SafeActionFn`

Type of the function called from components with typesafe input data.

```typescript
export type SafeActionFn<ServerError, S extends Schema, BAS extends Schema[], Data> = (
  ...clientInputs: [...InferInArray<BAS>, InferIn<S>]
) => Promise<SafeActionResult<ServerError, S, BAS, Data>>;
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
export type ServerCodeFn<S extends Schema, BAS extends Schema[], Data, Context> = (args: {
  parsedInput: Infer<S>;
  bindArgsParsedInputs: InferArray<BAS>;
  ctx: Context;
  metadata: ActionMetadata;
}) => Promise<Data>;
```

### `ValidationErrors`

Type of the returned object when input validation fails.

```typescript
export type ValidationErrors<S extends Schema> = Extend<ErrorList & SchemaErrors<Infer<S>>>;
```

### `BindArgsValidationErrors`

```typescript
export type BindArgsValidationErrors<BAS extends Schema[]> = (ValidationErrors<BAS[number]> | null)[];
```

Type of the array of validation errors of bind arguments.

## /hooks

### `HookResult`

Type of `result` object returned by `useAction` and `useOptimisticAction` hooks.

If a server-client communication error occurs, `fetchError` will be set to the error message.

```typescript
export type HookResult<
  ServerError,
  S extends Schema,
  BAS extends Schema[],
  Data,
> = SafeActionResult<ServerError, S, BAS, Data> & {
  fetchError?: string;
};
```

### `HookCallbacks`

Type of hooks callbacks. These are executed when action is in a specific state.

```typescript
export type HookCallbacks<ServerError, S extends Schema, BAS extends Schema[], Data> = {
  onExecute?: (input: InferIn<S>) => MaybePromise<void>;
  onSuccess?: (data: Data, input: InferIn<S>, reset: () => void) => MaybePromise<void>;
  onError?: (
    error: Omit<HookResult<ServerError, S, BAS, Data>, "data">,
    input: InferIn<S>,
    reset: () => void
  ) => MaybePromise<void>;
  onSettled?: (
    result: HookResult<ServerError, S, BAS, Data>,
    input: InferIn<S>,
    reset: () => void
  ) => MaybePromise<void>;
};
```

### `HookSafeActionFn`

 Type of the safe action function passed to hooks. Same as `SafeActionFn` except it accepts just a single input, without bind arguments.

```typescript
export type HookSafeActionFn<ServerError, S extends Schema, BAS extends Schema[], Data> = (
  clientInput: InferIn<S>
) => Promise<SafeActionResult<ServerError, S, BAS, Data>>;
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
