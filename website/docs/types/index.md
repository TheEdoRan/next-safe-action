---
sidebar_position: 6
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
  ctx: object;
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
  NextCtx = object,
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
export type MiddlewareResult<ServerError, NextCtx extends object> = SafeActionResult<
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
  ctx?: object;
  success: boolean;
};
```

### `MiddlewareFn`

Type of the middleware function passed to a safe action client.

```typescript
export type MiddlewareFn<ServerError, MD, Ctx, NextCtx extends object> = {
  (opts: {
    clientInput: unknown;
    bindArgsClientInputs: unknown[];
    ctx: Ctx;
    metadata: MD;
    next: {
      <NC extends object = {}>(opts: { ctx: NC }): Promise<MiddlewareResult<ServerError, NC>>;
    };
  }): Promise<MiddlewareResult<ServerError, NextCtx>>;
};
```

### `ServerCodeFn`

Type of the function that executes server code when defining a new safe action.

```typescript
export type ServerCodeFn<
  MD,
  Ctx extends object,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  Data,
> = (args: {
  parsedInput: S extends Schema ? Infer<S> : undefined;
  bindArgsParsedInputs: InferArray<BAS>;
  ctx: Prettify<Ctx>;
  metadata: MD;
}) => Promise<Data>;
```

### `StateServerCodeFn`

Type of the function that executes server code when defining a new stateful safe action.

```typescript
export type StateServerCodeFn<
  ServerError,
  MD,
  Ctx extends object,
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

### `SafeActionUtils`

Type of action execution utils. It includes action callbacks and other utils.

```typescript
export type SafeActionUtils<
  ServerError,
  MD,
  Ctx extends object,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
> = {
  throwServerError?: boolean;
  throwValidationErrors?: boolean;
  onSuccess?: (args: {
    data?: Data;
    metadata: MD;
    ctx?: Prettify<Ctx>;
    clientInput: S extends Schema ? InferIn<S> : undefined;
    bindArgsClientInputs: InferInArray<BAS>;
    parsedInput: S extends Schema ? Infer<S> : undefined;
    bindArgsParsedInputs: InferArray<BAS>;
    hasRedirected: boolean;
    hasNotFound: boolean;
  }) => MaybePromise<void>;
  onError?: (args: {
    error: Prettify<Omit<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>, "data">>;
    metadata: MD;
    ctx?: Prettify<Ctx>;
    clientInput: S extends Schema ? InferIn<S> : undefined;
    bindArgsClientInputs: InferInArray<BAS>;
  }) => MaybePromise<void>;
  onSettled?: (args: {
    result: Prettify<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>>;
    metadata: MD;
    ctx?: Prettify<Ctx>;
    clientInput: S extends Schema ? InferIn<S> : undefined;
    bindArgsClientInputs: InferInArray<BAS>;
    hasRedirected: boolean;
    hasNotFound: boolean;
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

### `InferSafeActionFnInput`

Infer input types of a safe action.

```typescript
export type InferSafeActionFnInput<T extends Function> = T extends
  | SafeActionFn<any, infer S extends Schema | undefined, infer BAS extends readonly Schema[], any, any, any>
  | SafeStateActionFn<any, infer S extends Schema | undefined, infer BAS extends readonly Schema[], any, any, any>
  ? S extends Schema
    ? {
        clientInput: InferIn<S>;
        bindArgsClientInputs: InferInArray<BAS>;
        parsedInput: Infer<S>;
        bindArgsParsedInputs: InferArray<BAS>;
      }
    : {
        clientInput: undefined;
        bindArgsClientInputs: InferInArray<BAS>;
        parsedInput: undefined;
        bindArgsParsedInputs: InferArray<BAS>;
      }
  : never;
```

### `InferSafeActionFnResult`

Infer the result type of a safe action.

```typescript
export type InferSafeActionFnResult<T extends Function> = T extends
  | SafeActionFn<
      infer ServerError,
      infer S extends Schema | undefined,
      infer BAS extends readonly Schema[],
      infer CVE,
      infer CBAVE,
      infer Data
    >
  | SafeStateActionFn<
      infer ServerError,
      infer S extends Schema | undefined,
      infer BAS extends readonly Schema[],
      infer CVE,
      infer CBAVE,
      infer Data
    >
  ? SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data>
  : never;
```

### `InferMiddlewareFnNextCtx`

Infer the next context type returned by a middleware function using the `next` function.

```typescript
export type InferMiddlewareFnNextCtx<T> =
  T extends MiddlewareFn<any, any, any, infer NextCtx extends object> ? NextCtx : never;
```

### `InferCtx`

Infer the context type of a safe action client or middleware function.

```typescript
export type InferCtx<T> = T extends
  | SafeActionClient<any, any, any, any, infer Ctx extends object, any, any, any, any, any>
  | MiddlewareFn<any, any, infer Ctx extends object, any>
  ? Ctx
  : never;
```

### `InferMetadata`

Infer the metadata type of a safe action client or middleware function.

```typescript
export type InferMetadata<T> = T extends
  | SafeActionClient<any, any, any, infer MD, any, any, any, any, any, any>
  | MiddlewareFn<any, infer MD, any, any>
  ? MD
  : never;
```

### `InferServerError`

Infer the server error type from a safe action client or a middleware function or a safe action function.

```typescript
export type InferServerError<T> = T extends
  | SafeActionClient<infer ServerError, any, any, any, any, any, any, any, any, any>
  | MiddlewareFn<infer ServerError, any, any, any>
  | SafeActionFn<infer ServerError, any, any, any, any, any>
  | SafeStateActionFn<infer ServerError, any, any, any, any, any>
  ? ServerError
  : never;
```

## /hooks

### `HookBaseUtils`

Type of base utils object passed to `useAction`, `useOptimisticAction` and `useStateAction` hooks.

```typescript
export type HookBaseUtils<S extends Schema | undefined> = {
  executeOnMount?: (undefined extends S
    ? { input?: undefined }
    : {
        input: S extends Schema ? InferIn<S> : undefined;
      }) & { delayMs?: number };
};
```

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

Type of the action status returned by `useAction`, `useOptimisticAction` and `useStateAction` hooks.

```typescript
type HookActionStatus = "idle" | "executing" | "hasSucceeded" | "hasErrored";
```

### `HookShorthandStatus`

Type of the shorthand status object returned by `useAction`, `useOptimisticAction` and `useStateAction` hooks.

```typescript
export type HookShorthandStatus = {
  isIdle: boolean;
  isExecuting: boolean;
  isTransitioning: boolean;
  isPending: boolean;
  hasSucceeded: boolean;
  hasErrored: boolean;
};
```

### `UseActionHookReturn`

Type of the return object of the `useAction` hook.

```typescript
export type UseActionHookReturn<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
> = {
  execute: (input: S extends Schema ? InferIn<S> : void) => void;
  executeAsync: (
    input: S extends Schema ? InferIn<S> : void
  ) => Promise<SafeActionResult<ServerError, S, BAS, CVE, CBAVE, Data> | undefined>;
  input: S extends Schema ? InferIn<S> : undefined;
  result: Prettify<HookResult<ServerError, S, BAS, CVE, CBAVE, Data>>;
  reset: () => void;
  status: HookActionStatus;
} & HookShorthandStatus;
```

### `UseOptimisticActionHookReturn`

Type of the return object of the `useOptimisticAction` hook.

```typescript
export type UseOptimisticActionHookReturn<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
  State,
> = UseActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data> &
  HookShorthandStatus & {
    optimisticState: State;
  };
```

### `UseStateActionHookReturn`

Type of the return object of the `useStateAction` hook.

```typescript
export type UseStateActionHookReturn<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
> = Omit<UseActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data>, "executeAsync" | "reset"> & HookShorthandStatus;
```

### `InferUseActionHookReturn`

Type of the return object of the `useAction` hook.

```typescript
export type InferUseActionHookReturn<T extends Function> =
  T extends SafeActionFn<
    infer ServerError,
    infer S extends Schema | undefined,
    infer BAS extends readonly Schema[],
    infer CVE,
    infer CBAVE,
    infer Data
  >
    ? UseActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data>
    : never;
```

### `InferUseOptimisticActionHookReturn`

Type of the return object of the `useOptimisticAction` hook.

```typescript
export type InferUseOptimisticActionHookReturn<T extends Function, State = any> =
  T extends SafeActionFn<
    infer ServerError,
    infer S extends Schema | undefined,
    infer BAS extends readonly Schema[],
    infer CVE,
    infer CBAVE,
    infer Data
  >
    ? UseOptimisticActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data, State>
    : never;
```

### `InferUseStateActionHookReturn`

Type of the return object of the `useStateAction` hook.

```typescript
export type InferUseStateActionHookReturn<T extends Function> =
  T extends SafeStateActionFn<
    infer ServerError,
    infer S extends Schema | undefined,
    infer BAS extends readonly Schema[],
    infer CVE,
    infer CBAVE,
    infer Data
  >
    ? UseStateActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data>
    : never;
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
