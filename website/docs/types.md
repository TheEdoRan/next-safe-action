---
sidebar_position: 7
description: List of next-safe-action types.
---

# Types

## /

### `DVES`

Type of the default validation errors shape passed to `createSafeActionClient` via `defaultValidationErrorsShape` property.

```typescript
export type DVES = "flattened" | "formatted";
```

### `ServerErrorFunctionUtils`

Type of the util properties passed to server error handler functions.

```typescript
export type ServerErrorFunctionUtils<MetadataSchema extends Schema | undefined> = {
  clientInput: unknown;
  bindArgsClientInputs: unknown[];
  ctx: unknown;
  metadata: MetadataSchema extends Schema ? Infer<MetadataSchema> : undefined;
};
```

### `SafeActionClientOpts`

Type of options when creating a new safe action client.

```typescript
export type SafeActionClientOpts<
  ServerError,
  MetadataSchema extends Schema | undefined,
  ODVES extends DVES | undefined,
> = {
  defineMetadataSchema?: () => MetadataSchema;
  handleReturnedServerError?: (
    error: Error,
    utils: ServerErrorFunctionUtils<MetadataSchema>
  ) => MaybePromise<ServerError>;
  handleServerErrorLog?: (
    originalError: Error,
    utils: ServerErrorFunctionUtils<MetadataSchema> & {
      returnedError: ServerError;
    }
  ) => MaybePromise<void>;
  throwValidationErrors?: boolean;
  defaultValidationErrorsShape?: ODVES;
};
```

### `SafeActionResult`

Type of the result of a safe action.

```typescript
export type SafeActionResult<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE = ValidationErrors<S>,
  CBAVE = BindArgsValidationErrors<BAS>,
  Data = unknown,
  // eslint-disable-next-line
  NextCtx = unknown,
> = {
      data?: Data;
      serverError?: ServerError;
      validationErrors?: CVE;
      bindArgsValidationErrors?: CBAVE;
    };
```

### `SafeActionFn`

Type of the function called from components with typesafe input data.

```typescript
export type SafeActionFn<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data
> = (
  ...clientInputs: [...bindArgsInputs: InferInArray<BAS>, input: S extends Schema ? InferIn<S> : void]
) => Promise<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data> | undefined>;
```

### `SafeStateActionFn`

Type of the stateful function called from components with type safe input data.

```typescript
export type SafeStateActionFn<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
> = (
  ...clientInputs: [
    ...bindArgsInputs: InferInArray<BAS>,
    prevResult: Prettify<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>,
    input: S extends Schema ? InferIn<S> : void,
  ]
) => Promise<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>;
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
  any,
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
export type MiddlewareFn<ServerError, MD, Ctx, NextCtx> = {
  (opts: {
    clientInput: unknown;
    bindArgsClientInputs: unknown[];
    ctx: Ctx;
    metadata: MD;
    next: {
      <NC>(opts: { ctx: NC }): Promise<MiddlewareResult<ServerError, NC>>;
    };
  }): Promise<MiddlewareResult<ServerError, NextCtx>>;
};
```

### `ServerCodeFn`

Type of the function that executes server code when defining a new safe action.

```typescript
export type ServerCodeFn<MD, Ctx, S extends Schema | undefined, BAS extends readonly Schema[], Data> = (args: {
  parsedInput: S extends Schema ? Infer<S> : undefined;
  bindArgsParsedInputs: InferArray<BAS>;
  ctx: Ctx;
  metadata: MD;
}) => Promise<Data>;
```

### `StateServerCodeFn`

Type of the function that executes server code when defining a new stateful safe action.

```typescript
export type StateServerCodeFn<
  ServerError,
  MD,
  Ctx
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
> = (
  args: {
    parsedInput: S extends Schema ? Infer<S> : undefined;
    bindArgsParsedInputs: InferArray<BAS>;
    ctx: Ctx;
    metadata: MD;
  },
  utils: { prevResult: Prettify<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>> }
) => Promise<Data>;
```

### `SafeActionCallbacks`

Type of action execution callbacks. These are called after the action is executed, on the server side.

```typescript
export type SafeActionCallbacks<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
> = {
  onSuccess?: (args: {
    data?: Data;
    clientInput: S extends Schema ? InferIn<S> : undefined;
    bindArgsClientInputs: InferInArray<BAS>;
    parsedInput: S extends Schema ? Infer<S> : undefined;
    bindArgsParsedInputs: InferArray<BAS>;
  }) => MaybePromise<void>;
  onError?: (args: {
    error: Omit<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>, "data">;
    clientInput: S extends Schema ? InferIn<S> : undefined;
    bindArgsClientInputs: InferInArray<BAS>;
  }) => MaybePromise<void>;
  onSettled?: (args: {
    result: SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>;
    clientInput: S extends Schema ? InferIn<S> : undefined;
    bindArgsClientInputs: InferInArray<BAS>;
  }) => MaybePromise<void>;
};
```

### `ValidationErrors`

Type of the returned object when input validation fails.

```typescript
export type ValidationErrors<S extends Schema | undefined> = S extends Schema
  ? Infer<S> extends object
    ? Prettify<VEList & SchemaErrors<Infer<S>>>
    : VEList
  : undefined;
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

### `HandleValidationErrorsShapeFn`

Type of the function used to format validation errors to custom shape.

```typescript
export type HandleValidationErrorsShapeFn<S extends Schema | undefined, CVE> = (
  validationErrors: ValidationErrors<S>
) => CVE;
```

### `HandleBindArgsValidationErrorsShapeFn`

Type of the function used to format bind arguments validation errors to custom shape.

```typescript
export type HandleBindArgsValidationErrorsShapeFn<BAS extends readonly Schema[], FBAVE> = (
  bindArgsValidationErrors: BindArgsValidationErrors<BAS>
) => FBAVE;
```

## /hooks

### `HookResult`

Type of `result` object returned by `useAction`, `useOptimisticAction` and `useStateAction` hooks.

If a server-client communication error occurs, `fetchError` will be set to the error message.

```typescript
export type HookResult<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
> = SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data> & {
  fetchError?: string;
};
```

### `HookCallbacks`

Type of hooks callbacks. These are executed when action is in a specific state.

```typescript
export type HookCallbacks<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
> = {
  onExecute?: (args: { input: S extends Schema ? InferIn<S> : undefined }) => MaybePromise<void>;
  onSuccess?: (args: { data: Data; input: S extends Schema ? InferIn<S> : undefined }) => MaybePromise<void>;
  onError?: (args: {
    error: Omit<HookResult<ServerError, S, BAS, CVE, CBAVE, Data>, "data">;
    input: S extends Schema ? InferIn<S> : undefined;
  }) => MaybePromise<void>;
  onSettled?: (args: {
    result: HookResult<ServerError, S, BAS, CVE, CBAVE, Data>;
    input: S extends Schema ? InferIn<S> : undefined;
  }) => MaybePromise<void>;
};
```

### `HookSafeActionFn`

Type of the safe action function passed to hooks. Same as `SafeActionFn` except it accepts just a single input, without bind arguments.

```typescript
export type HookSafeActionFn<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
> = (
  input: S extends Schema ? InferIn<S> : undefined
) => Promise<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data> | undefined>;
```

### `HookSafeStateActionFn`

Type of the stateful safe action function passed to hooks. Same as `SafeStateActionFn` except it accepts just a single input, without bind arguments.

```typescript
export type HookSafeStateActionFn<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
> = (
  prevResult: SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>,
  input: S extends Schema ? InferIn<S> : undefined
) => Promise<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>;
```

### `HookActionStatus`

Type of the action status returned by `useAction` and `useOptimisticAction` hooks.

```typescript
type HookActionStatus = "idle" | "executing" | "hasSucceeded" | "hasErrored";
```

---

## Internal utility types

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

## Internal validation errors types

### `VEList`

Object with an optional list of validation errors. Used in [`ValidationErrors`](#validationerrors) type.

```typescript
export type VEList = Prettify<{ _errors?: string[] }>;
```

### `SchemaErrors`

Creates nested schema validation errors type using recursion. Used in [`ValidationErrors`](#validationerrors) type.

```typescript
type SchemaErrors<S> = {
  [K in keyof S]?: S[K] extends object | null | undefined ? Prettify<VEList & SchemaErrors<S[K]>> : VEList;
} & {};
```

---

## Adapters types

`Infer`, `InferIn`, `Schema` types used in this documentation come from `next-safe-action/adapters/types` path.
