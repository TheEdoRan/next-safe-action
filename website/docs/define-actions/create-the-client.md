---
sidebar_position: 1
description: Learn how to create a safe action client,
---

# Create the client

After [installing the library](/docs/getting-started#installation), the first thing you have to do is to create an instance of the safe action client:

```typescript title="src/lib/safe-action.ts"
import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient();
```

In the following section we will go through all the options that can be passed to the `createSafeActionClient()` function to customize the client behavior for your needs.

## Initialization options

### `handleServerError()?`

This optional function handles errors that occur during action's server execution, middleware included. It's used to customize logging and the shape of the server error returned to the client. You also have access to useful properties via the `utils` object, which is the second argument of the function. If not provided, it defaults to console logging the error message and returning a generic string to the client, for all the errors (`DEFAULT_SERVER_ERROR_MESSAGE`, exported from `next-safe-action`).

Here's a simple example, changing the default message for every error thrown on the server, while keeping the console logging:

```typescript title=src/lib/safe-action.ts
import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
  // Can also be an async function.
  handleServerError(e, utils) {
    // You can access these properties inside the `utils` object.
    const { clientInput, bindArgsClientInputs, metadata, ctx } = utils;

    // Log to console.
    console.error("Action error:", e.message);

    // Return generic message
    return "Oh no, something went wrong!";
  },
});
```

<br />

A more useful one would be to customize the message based on the error type. We can, for instance, create a custom error class and check the error type inside this function:

```typescript title=src/lib/safe-action.ts
import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from "next-safe-action";

class MyCustomError extends Error {}

export const actionClient = createSafeActionClient({
  // Can also be an async function.
  handleServerError(e) {
    // Log to console.
    console.error("Action error:", e.message);

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

You can also easily rethrow all occurred server errors, if you prefer that behavior. This way, `serverError` in the [action result object](/docs/define-actions/action-result-object) will always be undefined and the action called from the client will throw the server error:

```typescript title=src/lib/safe-action.ts
import { createSafeActionClient } from "next-safe-action";

class MyCustomError extends Error {}

export const actionClient = createSafeActionClient({
  // Can also be an async function.
  handleServerError(e) {
    // Log to console.
    console.error("Action error:", e.message);

    // Rethrow all server errors:
    throw e;
  },
});
```

### `defineMetadataSchema()?`

This optional function is used to define the type of the metadata for safe actions. If not provided, `metadata` will default to `undefined` value. You can find more information about metadata in the [`metadata()` instance method section](/docs/define-actions/instance-methods#metadata). If you define a metadata schema and you don't call the `metadata()` method before defining an action, an error will be thrown.

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

### `defaultValidationErrorsShape?`

This optional property is used to specify the default shape of the validation errors. The two possible values are `flattened` and `formatted`. The first one emulates Zod [`flatten()`](https://zod.dev/ERROR_HANDLING?id=flattening-errors) method, the second one emulates Zod [`format()`](https://zod.dev/ERROR_HANDLING?id=formatting-errors) method. You can override the default shape in `schema()` method, more information about that [here](/docs/define-actions/validation-errors#customize-validation-errors-format). If this property is not provided, the default shape is `formatted`, as it also catches errors for nested schema objects.

```typescript
import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
  // By default all actions will return validation errors in the `flattened` shape.
  defaultValidationErrorsShape: "flattened",
});
```

### `throwValidationErrors?`

This optional boolean property changes the default behavior of validation errors handling. When this option is set to `true`, the action will throw a `ActionValidationError` with the related validation errors in a `validationErrors` property. This option also works for server validation errors set with [`returnValidationErrors`](/docs/define-actions/validation-errors#returnvalidationerrors) function. The errors shape follows the `defaultValidationErrorsShape` option or the overridden one set in [`inputSchema()`](/docs/define-actions/instance-methods#inputschema) using the optional [`handleValidationErrorsShape()`](/docs/define-actions/validation-errors#customize-validation-errors-format) function. The default value is `false`.
