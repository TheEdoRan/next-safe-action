---
sidebar_position: 2
description: List of methods of the safe action client.
---

# Instance methods

`createSafeActionClient` creates an instance of the safe action client, which has the following methods:

## `clone`

```typescript
actionClient.clone() => new SafeActionClient()
```

`clone` returns a new instance of the safe action client with the same initialization options and middleware functions as the original one. It is used to extend a base client with additional middleware functions. If you don't use `clone` when creating a new client, the middleware function list of the original one will be mutated and extended with the new ones, which is not desirable.

## `use`

```typescript
use<const ClientInput, const NextCtx>(middlewareFn: MiddlewareFn<ClientInput, Ctx, NextCtx>) => new SafeActionClient()
```

`use` accepts a middleware function of type [`MiddlewareFn`](/docs/types#middlewarefn) as argument and returns a new instance of the safe action client with that middleware function added to the stack, that will be executed after the last one, if any. Check out how to `use` middleware in [the related section](/docs/usage/middleware) of the usage guide.

## `metadata`

```typescript
metadata(data: ActionMetadata) => { schema() }
```

`metadata` expects an object of type [`ActionMetadata`](/docs/types#actionmetadata) that lets you specify useful data about the safe action you're defining, and it returns the [`schema`](#schema) method, since metadata is action specific and not shared with other actions. As of now, the only data you can pass in is the `actionName`, but that could be extended in the future. You can then access it in the `middlewareFn` passed to [`use`](#use) and in [`serverCodeFn`](#servercodefn) passed to [`action`](#action).

## `schema`

```typescript
schema<const S extends Schema>(schema: S) => { action(), bindArgsSchemas() }
```

`schema` accepts an input schema of type `Schema` (from TypeSchema), which is used to define the arguments that the safe action will receive, and returns the [`action`](#action) and [`bindArgsSchemas`](#bindargsschemas) methods, which allows you, respectively, to define a new action using that input schema or extend the arguments with additional bound ones.

## `bindArgsSchemas`

```typescript
bindArgsSchemas<const BAS extends Schema[]>(bindArgsSchemas: BAS) => { action() }
```

`bindArgsSchemas` accepts an array of bind input schemas of type `Schema` (from TypeSchema), which is used to define the bind arguments that the safe action will receive, and returns the [`action`](#action) method, which allows you, to define a new action using the input and bind inputs schemas.

## `action`

```typescript
action<const Data = null>(serverCodeFn: ServerCodeFn<S, Data, Ctx>) => SafeActionFn<S, Data>
```

`action` is the final method in the list. It accepts a [`serverCodeFn`](#servercodefn) of type [`ServerCodeFn`](/docs/types#servercodefn) and returns a new safe action function of type [`SafeActionFn`](/docs/types#safeactionfn), which can be called from your components.

When the action is executed, all middleware functions in the chain will be called at runtime, in the order they were defined.

### `serverCodeFn`

```typescript
serverCodeFn<S extends Schema, Data, Context> = (args: { parsedInput: Infer<S>, ctx: Context; metadata: ActionMetadata }) => Promise<Data>;
```

`serverCodeFn` is the async function that will be executed on the **server side** when the action is invoked. If input validation fails, or execution gets halted in a middleware function, the server code function will not be called.
