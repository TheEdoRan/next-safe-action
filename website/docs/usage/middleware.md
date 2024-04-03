---
sidebar_position: 3
description: Learn how to use middleware functions in your actions.
---

# Middleware

next-safe-action, since version 7, ships with a composable and powerful middleware system, which allows you to create functions for almost every kind of use case you can imagine (authorization, logging, role based access, etc.). It works very similarly to the [tRPC implementation](https://trpc.io/docs/server/middlewares), with some minor differences.

Middleware functions are defined using [`use`](/docs/safe-action-client/instance-methods#use) method in your action clients, via the `middlewareFn` argument.

## Usage

You can chain multiple middleware functions, that will be executed in the order they were defined. You can also await the next middleware function(s) in the stack (useful, for instance, for logging), and then return the result of the execution. Chaining functions is very useful when you want to dynamically extend the context and/or halt execution based on your use case.

### Instance level middleware

Instance level is the right place when you want to share middleware behavior for all the actions you're going to define; for example when you need to log the result of actions execution, or verify if the user intending to execute the operation is authorized to do so, and if not, halt the execution at that point, by throwing an error.

Here we'll use a logging middleware in the base client and then extend it with an authorization middleware in `authActionClient`. We'll also define a safe action called `editProfile`, that will use `authActionClient` as its client. Note that the `handleReturnedServerError` function passed to the base client will also be used for `authActionClient`:

```typescript title="src/lib/safe-action.ts"
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action";
import { cookies } from "next/headers";
import { getUserIdFromSessionId } from "./db";

class ActionError extends Error {}

// Base client.
const actionClient = createSafeActionClient({
  handleReturnedServerError(e) {
    if (e instanceof ActionError) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
// Define logging middleware.
}).use(async ({ next, clientInput, metadata }) => {
  console.log("LOGGING MIDDLEWARE");

  // Here we await the action execution.
  const result = await next({ ctx: null });

  console.log("Result ->", result);
  console.log("Client input ->", clientInput);
  console.log("Metadata ->", metadata);

  // And then return the result of the awaited action.
  return result;
});

// Auth client defined by extending the base one.
// Note that the same initialization options and middleware functions of the base client
// will also be used for this one.
const authActionClient = actionClient
  // Clone the base client so it doesn't get mutated.
  .clone()
  // Define authorization middleware.
  .use(async ({ next }) => {
    const session = cookies().get("session")?.value;

    if (!session) {
      throw new Error("Session not found!");
    }

    const userId = await getUserIdFromSessionId(session);

    if (!userId) {
      throw new Error("Session is not valid!");
    }

    // Return the next middleware with `userId` value in the context
    return next({ ctx: { userId } });
  });
```

Here we import `authActionClient` in the action's file:

```typescript title="src/app/edituser-action.ts"
"use server";

import { authActionClient } from "@/lib/safe-action";
import { z } from "zod";

const editProfile = authActionClient
  // We can pass the action name inside `metadata()`.
  .metadata({ actionName: "editProfile" }) 
  // Here we pass the input schema.
  .schema(z.object({ newUsername: z.string() }))
  // Here we get `userId` from the middleware defined in `authActionClient`.
  .define(async ({ newUsername }, { ctx: { userId } }) => { 
    await saveNewUsernameInDb(userId, newUsername);

    return {
      updated: true,
    };
  });
```

Calling `editProfile` will produce this console output, thanks to the two middleware functions passed to the clients above:

```
LOGGING MIDDLEWARE
Result -> {
  success: true,
  ctx: { userId: 'e473de7f-d1e4-49c1-b4fe-85eb50048b99' },
  data: { updated: true },
  parsedInput: { newUsername: 'johndoe' }
}
Client input -> { newUsername: 'johndoe' }
Metadata -> { actionName: 'editProfile' }
```

Note that `userId` in `ctx` comes from the `authActionClient` middleware, and console output comes from the logging middleware defined in the based client.

### Action level middleware

Server Action level is the right place for middleware checks that only specific actions need to make. For instance, when you want to restrict the execution to specific user roles.

In this example we'll use the same `authActionClient` defined above to define a `deleteUser` action that chains a middleware function which restricts the execution of this operation to just admins:

```typescript title="src/app/deleteuser-action.ts"
"use server";

import { authActionClient } from "@/lib/safe-action";
import { z } from "zod";

const deleteUser = authActionClient
  .use(async ({ next, ctx }) => {
    // `userId` comes from the context set in the previous middleware function.
    const userRole = await getUserRole(ctx.userId);

    if (userRole !== "admin") {
      throw new ActionError("Only admins can delete users.");
    }

    // Here we pass the same untouched context (`userId`) to the next function, since we don't need
    // to add data to the context here.
    return next({ ctx }); 
  })
  .metadata({ actionName: "deleteUser" })
  .schema(z.void())
  .define(async (_, { ctx: { userId } }) => {
    // Here we're sure that the user that is performing this operation is an admin.
    await deleteUserFromDb(userId);
  });
```

This is the console output when an admin executes this action:

```
LOGGING MIDDLEWARE
Result -> {
  success: true,
  ctx: { userId: '9af18417-524e-4f04-9621-b5934b09f2c9' },
  data: null,
  parsedInput: undefined
}
Client input -> undefined
Metadata -> { actionName: 'deleteUser' }
```

If a regular user tries to do the same, the execution will be stopped at the last middleware function, defined at the action level, that checks the user role. This is the console output in this case:

```
LOGGING MIDDLEWARE
Action error: Only admins can delete users.
Result -> {
  success: false,
  ctx: { userId: '0a1fa8a8-d323-47c0-bbde-eadbfcdd2587' },
  serverError: 'Only admins can delete users.'
}
Client input -> undefined
Metadata -> { actionName: 'deleteUser' }
```

Note that the second line comes from the default `handleServerErrorLog` function of the safe action client(s).

---

## `middlewareFn` arguments

`middlewareFn` has the following arguments:

| Name          | Type                                                           | Purpose                                                                                                                                                                      |
|---------------|----------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `clientInput` | `ClientInput` (generic)                                        | The raw input (not parsed) passed from client.                                                                                                                               |
| `ctx`         | `Ctx` (generic)                                                | Type safe context value from previous middleware function(s).                                                                                                                |
| `metadata`    | [`ActionMetadata`](/docs/types/#actionmetadata)                | Metadata for the safe action execution.                                                                                                                                    |
| `next`        | `<const NC>(opts: { ctx: NC }): Promise<MiddlewareResult<NC>>` | Function that will execute the next function in the middleware stack or the server code function. It expects, as argument, the next `ctx` value for the next function in the chain. |

## `middlewareFn` return value

`middlewareFn` returns a Promise of a [`MiddlewareResult`](/docs/types#middlewareresult) object. It extends the result of a safe action with `success` property, and `parsedInput` and `ctx` optional properties. This is the exact return type of the `next` function, so you must always return it (or its result) to continue executing the middleware chain.