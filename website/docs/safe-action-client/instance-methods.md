---
sidebar_position: 2
description: List of methods of the safe action client.
---

# Instance methods

`createSafeActionClient` creates an instance of the safe action client, which has the following methods:

## `use`

```typescript
use<const NextCtx>(middlewareFn: MiddlewareFn<ServerError, Ctx, NextCtx, Metadata>) => new SafeActionClient()
```

`use` accepts a middleware function of type [`MiddlewareFn`](/docs/types#middlewarefn) as argument and returns a new instance of the safe action client with that middleware function added to the stack, that will be executed after the last one, if any. Check out how to `use` middleware in [the related section](/docs/usage/middleware) of the usage guide.

## `metadata`

```typescript
metadata(data: Metadata) => { schema() }
```

`metadata` expects an argument of the same type as the return value of the [`defineMetadataSchema`](/docs/safe-action-client/initialization-options#definemetadataschema) optional initialization function. If you don't provide this function to the action client when you initialize it, `metadata` will be `null`.

`metadata` lets you specify useful data about the safe action you're executing. If you don't use this method before defining your action (using [`action`](#action) method), `metadata` will be `null` inside [`serverCodeFn`](#servercodefn). It returns the [`schema`](#schema) method, since metadata is action specific and not shared with other actions. You can then access it in the `middlewareFn` passed to [`use`](#use) and in [`serverCodeFn`](#servercodefn) passed to [`action`](#action).

## `schema`

```typescript
schema<const S extends Schema | undefined = undefined, const FVE = ValidationErrors<S>, const MD = null>(schema: S, { utils?: { formatValidationErrors?: FormatValidationErrorsFn<S, FVE> } }) => { action(), bindArgsSchemas() }
```

`schema` accepts an **optional** input schema of type `Schema` (from TypeSchema) and an optional `utils` object that accepts a [`formatValidationErrors`](/docs/recipes/customize-validation-errors-format) function. The schema is used to define the arguments that the safe action will receive, the optional [`formatValidationErrors`](/docs/recipes/customize-validation-errors-format) function is used to return a custom format for validation errors. If you don't pass an input schema, `parsedInput` and validation errors will be typed `undefined`, and `clientInput` will be typed `void`. It returns the [`action`](#action) and [`bindArgsSchemas`](#bindargsschemas) methods, which allows you, respectively, to define a new action using that input schema or extend the arguments with additional bound ones.

## `bindArgsSchemas`

```typescript
bindArgsSchemas<const BAS extends Schema[], const FBAVE = BindArgsValidationErrors<BAS>>(bindArgsSchemas: BAS, bindArgsUtils?: { formatBindArgsValidationErrors?: FormatBindArgsValidationErrorsFn<BAS, FBAVE> }) => { action() }
```

`bindArgsSchemas` accepts an array of bind input schemas of type `Schema[]` (from TypeSchema) and an optional `bindArgsUtils` object that accepts a `formatBindArgsValidationErrors` function. The schema is used to define the bind arguments that the safe action will receive, the optional `formatBindArgsValidationErrors` function is used to [return a custom format for bind arguments validation errors](/docs/recipes/customize-validation-errors-format). It returns the [`action`](#action) method, which allows you, to define a new action using the input and bind inputs schemas.

## `action`

```typescript
action<const Data = null>(serverCodeFn: ServerCodeFn<S, BAS, Data, Ctx, MD>) => SafeActionFn<ServerError, S, BAS, FVE, FBAVE, Data>
```

`action` is the final method in the list. It accepts a [`serverCodeFn`](#servercodefn) of type [`ServerCodeFn`](/docs/types#servercodefn) and returns a new safe action function of type [`SafeActionFn`](/docs/types#safeactionfn), which can be called from your components.

When the action is executed, all middleware functions in the chain will be called at runtime, in the order they were defined.

### `serverCodeFn`

```typescript
serverCodeFn<S, BAS, Data, Ctx, MD> = (args: { parsedInput: Infer<S>, bindArgsParsedInputs: InferArray<BAS>, ctx: Ctx, metadata: MD }) => Promise<Data>;
```

`serverCodeFn` is the async function that will be executed on the **server side** when the action is invoked. If input validation fails, or execution gets halted in a middleware function, the server code function will not be called.
