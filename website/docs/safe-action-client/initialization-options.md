---
sidebar_position: 1
description: You can initialize a safe action client with these options.
---

# Initialization options

## `handleReturnedServerError?`

You can provide this optional function to the safe action client. It is used to customize the server error returned to the client, if one occurs during action's server execution. This includes errors thrown by the action server code, and errors thrown by the middleware.

Here's a simple example, changing the default message for every error thrown on the server:

```typescript title=src/lib/safe-action.ts
import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
  // Can also be an async function.
  handleReturnedServerError(e) {
    return "Oh no, something went wrong!";
  },
});
```

<br/>

A more useful one would be to customize the message based on the error type. We can, for instance, create a custom error class and check the error type inside this function:

```typescript title=src/lib/safe-action.ts
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action";

class MyCustomError extends Error {}

export const actionClient = createSafeActionClient({
  // Can also be an async function.
  handleReturnedServerError(e) {
    // In this case, we can use the 'MyCustomError` class to unmask errors
    // and return them with their actual messages to the client.
    if (e instanceof MyCustomError) {
      return e.message;
    }

    // Every other error that occurs will be masked with the default message.
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});
```

You can also easily rethrow all occurred server errors, if you prefer that behavior. This way, `serverError` in the [action result object](/docs/execution/action-result-object) will always be undefined and the action called from the client will throw the server error:

```typescript title=src/lib/safe-action.ts
import { createSafeActionClient } from "next-safe-action";

class MyCustomError extends Error {}

export const actionClient = createSafeActionClient({
  // Can also be an async function.
  handleReturnedServerError(e) {
    // Rethrow all server errors:
    throw e;
  },
});
```

Note that the return type of this function will determine the type of the server error that will be returned to the client. By default it is a string with the `DEFAULT_SERVER_ERROR_MESSAGE` for all errors.

## `handleServerErrorLog?`

You can provide this optional function to the safe action client. This is used to define how errors should be logged when one occurs while the server is executing an action. This includes errors thrown by the action server code, and errors thrown by the middleware. Here you get as argument the **original error object**, not a message customized by `handleReturnedServerError`, if provided.

Here's a simple example, logging error to the console while also reporting it to an error handling system:

```typescript title=src/lib/safe-action.ts
import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
  // Can also be an async function.
  handleServerErrorLog(e) {
    // We can, for example, also send the error to a dedicated logging system.
    reportToErrorHandlingSystem(e);

    // And also log it to the console.
    console.error("Action error:", e.message);
  },
});
```

## `defineMetadataSchema?`

You can provide this optional function to the safe action client. This is used to define the type of the metadata for safe actions. If not provided, `metadata` will default to `undefined` value. You can find more information about metadata in the [`metadata` instance method section](/docs/safe-action-client/instance-methods#metadata). If you define a metadata schema and you don't call the `metadata` method before defining an action, an error will be thrown.

Here's an example defining a client with a metadata object containing `actionName` as a string, using a Zod schema:

```typescript title="src/app/safe-action.ts"
import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";

export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
    });
  },
});
```

## `defaultValidationErrorsShape?`

You can provide this optional property to `createSafeActionClient` to specify the default shape of the validation errors. The two possible values are `flattened` and `formatted`. The first one emulates Zod [`flatten`](https://zod.dev/ERROR_HANDLING?id=flattening-errors) method, the second one emulates Zod [`format`](https://zod.dev/ERROR_HANDLING?id=formatting-errors) method, both for `validationErrors` and `bindArgsValidationErrors`. You can override the default shape in `schema` and `bindArgsSchemas` methods, more information about that [here](/docs/recipes/customize-validation-errors-format). If this property is not provided, the default shape is `formatted`, as it also catches errors for nested schema objects.

```typescript
import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
  // By default all actions will return validation errors in the `flattened` shape.
  defaultValidationErrorsShape: "flattened",
});
```