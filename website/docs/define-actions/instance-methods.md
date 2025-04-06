---
sidebar_position: 2
description: List of methods of the safe action client.
---

# Instance methods

The instance created by `createSafeActionClient` has the following methods:

### `use`

```typescript
use(middlewareFn: MiddlewareFn) => new SafeActionClient()
```

`use` accepts a middleware function of type `MiddlewareFn` as argument and returns a new instance of the safe action client with that middleware function added to the stack, that will be executed after the last one, if any. Check out how to `use` middleware in [the related section](/docs/define-actions/middleware).

### `metadata`

```typescript
metadata(data: Metadata) => new SafeActionClient()
```

`metadata` expects an argument of the same type as the return value of the [`defineMetadataSchema`](/docs/define-actions/create-the-client#definemetadataschema) optional initialization function. If you don't provide this function to the action client when you initialize it, `metadata` will be `undefined`.

`metadata` lets you specify useful data about the safe action you're executing. You can access it in the `middlewareFn` passed to [`use`](#use) and in [`serverCodeFn`](#servercodefn) passed to [`action`/`stateAction`](#action--stateaction). If there's a mismatch between the metadata schema and the data you pass to `metadata`, the action will throw an error during execution. It returns a new instance of the safe action client.

### `inputSchema`

```typescript
inputSchema(inputSchema: S, utils?: { handleValidationErrorsShape?: HandleValidationErrorsShapeFn } }) => new SafeActionClient()
```

`inputSchema` accepts an input schema of type `Schema` or a function that returns a promise of type `Schema` and an optional `utils` object that accepts an async [`handleValidationErrorsShape`](/docs/define-actions/validation-errors#customize-validation-errors-format) function. The schema is used to define the arguments that the safe action will receive, the optional [`handleValidationErrorsShape`](/docs/define-actions/validation-errors#customize-validation-errors-format) function is used to return a custom format for validation errors. If you don't pass an input schema, `parsedInput` and validation errors will be typed `undefined`, and `clientInput` will be typed `void`. It returns a new instance of the safe action client.

### `bindArgsSchemas`

```typescript
bindArgsSchemas(bindArgsSchemas: BAS) => new SafeActionClient()
```

`bindArgsSchemas` accepts an array of bind input schemas of type `Schema[]`. It returns a new instance of the safe action client. If validation fails, an `ActionBindArgsValidationError` is thrown on the server side.

### `outputSchema`

```typescript
outputSchema(outputSchema: S) => new SafeActionClient()
```

`outputSchema` accepts a schema of type `Schema`. That schema is used to define what the safe action will return. If you don't pass an output schema when you're defining an action, the return type will be inferred instead. If validation fails, an `ActionOutputDataValidationError` is internally thrown. You can catch it inside [`handleServerError`](/docs/define-actions/create-the-client#handleservererror) and access the `validationErrors` property to get the validation errors. It returns a new instance of the safe action client.

### `action` / `stateAction`

```typescript
action(serverCodeFn: ServerCodeFn, utils?: SafeActionUtils) => SafeActionFn
```

```typescript
stateAction(serverCodeFn: StateServerCodeFn, utils?: SafeActionUtils) => SafeStateActionFn
```

`action`/`stateAction` is the final method in the list. It accepts a [`serverCodeFn`](#servercodefn) of type `ServerCodeFn`/`StateServerCodeFn` and an optional object with [action utils](/docs/define-actions/action-utils), and it returns a new safe action function of type `SafeActionFn`/`SafeStateActionFn`, which can be called from your components. When an action doesn't need input arguments, you can directly use this method without passing a schema to [`schema`](#schema) method.

When the action is executed, all middleware functions in the chain will be called at runtime, in the order they were defined.

### When to use `action` or `stateAction`

The only difference between `action` and `stateAction` is that [`useStateAction`](/docs/execute-actions/hooks/usestateaction) hook **requires** the usage of `stateAction` when defining a new Server Action function. Using `stateAction` changes the function signature: the first argument of the safe action will be `prevResult`, and the second one the client input, if a validation schema was passed to [`schema`](#schema) method. 

Note that when you use `stateAction`, and also want to access `prevResult` in `serverCodeFn`, you **must** type the returned data type of the function, since it can't be inferred, due to TypeScript limitations. See an example of this in the [`useStateAction` usage](/docs/execute-actions/hooks/usestateaction#example) section.

### `serverCodeFn`

```typescript title="Stateless action"
serverCodeFn(
  args: { parsedInput, bindArgsParsedInputs, clientInput, bindArgsClientInputs, ctx, metadata }
) => Promise<Data>;
```

```typescript title="Stateful action"
serverCodeFn = (
  args: { parsedInput, bindArgsParsedInputs, clientInput, bindArgsClientInputs, ctx, metadata },
  utils: { prevResult }
) => Promise<Data>;
```

`serverCodeFn` is the async function of type `ServerCodeFn`/`StateServerCodeFn` that will be executed on the **server side** when the action is invoked. If input validation fails, or execution gets halted in a middleware function, the server code function will not be called.

In the case of a stateful safe action, `serverCodeFn` will also receive the `prevResult` as a property of the second argument (`utils` object) from the previous action execution, thanks to the [`useStateAction`](/docs/execute-actions/hooks/usestateaction) hook (that uses React's [`useActionState`](https://react.dev/reference/react/useActionState) hook under the hood).

## Deprecated methods

### `schema`

`schema` is deprecated in v8, and it's just an alias for [`inputSchema`](#inputschema), so use that instead.