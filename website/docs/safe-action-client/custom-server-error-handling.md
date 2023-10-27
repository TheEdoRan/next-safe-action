---
sidebar_position: 2
description: Learn how to customize server error handling.
---

# Custom server error handling

### `handleReturnedServerError?`

You can provide this optional function to the safe action client. It is used to customize the server error message returned to the client, if one occurs during action's server execution. This includes errors thrown by the action server code, and errors thrown by the middleware.

Here's a simple example, changing the message for every error thrown on the server:

```typescript title=src/lib/safe-action.ts
export const action = createSafeActionClient({
  // Can also be an async function.
  handleReturnedServerError(e) {
    return {
      serverError: "Oh no, something went wrong!",
    };
  },
});
```

<br/>

A more useful one would be to customize the message based on the error type. We can, for instance, create a custom error class and check the error type inside this function:

```typescript title=src/lib/safe-action.ts
class MyCustomError extends Error {}

export const action = createSafeActionClient({
  handleReturnedServerError(e) {
    // In this case, we can use the 'MyCustomError` class to unmask errors
    // and return them with their actual messages to the client.
    if (e instanceof MyCustomError) {
      return {
        serverError: e.message,
      };
    }

    // Every other error will be masked with this message.
    return {
      serverError: "Oh no, something went wrong!",
    };
  },
});
```

### `handleServerErrorLog?`

You can provide this optional function to the safe action client. This is used to define how error should be logged when an error occurs while the server is executing an action. This includes errors thrown by the action server code, and errors thrown by the middleware. Here you get as argument the **original error**, not one with a custom message customized by `handleReturnedServerError`, if provided.

Here's a simple example, logging error to the console while also reporting it to an error handling system:

```typescript title=src/lib/safe-action.ts
export const action = createSafeActionClient({
  // Can also be an async function.
  handleServerErrorLog(e) {
    // We can, for example, also send the error to a dedicated logging system.
    reportToErrorHandlingSystem(e);

    // And also log it to the console.
    console.error("Action error:", e.message);
  }
});
```