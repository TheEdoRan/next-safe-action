---
sidebar_position: 3
description: Learn how to use middleware functions in your actions.
---

# Middleware

next-safe-action, since version 7, ships with a composable and powerful middleware system, which allows you to create functions for almost every kind of use case you can imagine (authorization, logging, role based access, etc.). It works very similarly to the [tRPC implementation](https://trpc.io/docs/server/middlewares).

Middleware functions are defined using [`use`](/docs/define-actions/instance-methods#use) method in your action clients, via the `middlewareFn` argument.

## Usage

You can chain multiple middleware functions, that will be executed in the order they were defined. You can also await the next middleware function(s) in the stack (useful, for instance, for logging), and then return the result of the execution. Chaining functions is very useful when you want to dynamically extend the context and/or halt execution based on your use case.

### Instance level middleware

Instance level is the right place when you want to share middleware behavior for all the actions you're going to define; for example when you need to log the result of actions execution, or verify if the user intending to execute the operation is authorized to do so, and if not, halt the execution at that point, by throwing an error.

Here we'll use a logging middleware in the base client and then extend it with an authorization middleware in `authActionClient`. We'll also define a safe action called `editProfile`, that will use `authActionClient` as its client. Note that the `handleReturnedServerError` function passed to the base client will also be used for `authActionClient`:

```typescript title="src/lib/safe-action.ts"
import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from "next-safe-action";
import { cookies } from "next/headers";
import { z } from "zod";
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
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
    });
  },
  // Define logging middleware.
  // highlight-start
}).use(async ({ next, clientInput, metadata }) => {
  console.log("LOGGING MIDDLEWARE");

  const startTime = performance.now();

  // Here we await the action execution.
  const result = await next();

  const endTime = performance.now();

  console.log("Result ->", result);
  console.log("Client input ->", clientInput);
  console.log("Metadata ->", metadata);
  console.log("Action execution took", endTime - startTime, "ms");

  // And then return the result of the awaited action.
  return result;
});
// highlight-end

// Auth client defined by extending the base one.
// Note that the same initialization options and middleware functions of the base client
// will also be used for this one.
export const authActionClient = actionClient
  // Define authorization middleware.
  // highlight-start
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
  // highlight-end
```

Here we import `authActionClient` in the action's file:

```typescript title="src/app/edituser-action.ts"
"use server";

// highlight-next-line
import { authActionClient } from "@/lib/safe-action";
import { z } from "zod";

const editProfile = authActionClient
  // We can pass the action name inside `metadata()`.
  .metadata({ actionName: "editProfile" })
  // Here we pass the input schema.
  .schema(z.object({ newUsername: z.string() }))
  // Here we get `userId` from the middleware defined in `authActionClient`.
  // highlight-next-line
  .action(async ({ parsedInput: { newUsername }, ctx: { userId } }) => {
    await saveNewUsernameInDb(userId, newUsername);

    return {
      updated: true,
    };
  });
```

### Action level middleware

Server Action level is the right place for middleware checks that only specific actions need to make. For instance, when you want to restrict the execution to specific user roles.

In this example we'll use the same `authActionClient` defined above to define a `deleteUser` action that chains a middleware function which restricts the execution of this operation to just admins:

```typescript title="src/app/deleteuser-action.ts"
"use server";

import { authActionClient } from "@/lib/safe-action";
import { z } from "zod";

const deleteUser = authActionClient
  // highlight-start
  .use(async ({ next, ctx }) => {
    // `userId` comes from the context set in the previous middleware function.
    const userRole = await getUserRole(ctx.userId);

    if (userRole !== "admin") {
      throw new ActionError("Only admins can delete users.");
    }

    // Here we pass the same untouched context (`userId`) to the next function, since we don't need
    // to add data to the context here.
    return next();
  })
  // highlight-end
  .metadata({ actionName: "deleteUser" })
  .action(async ({ ctx: { userId } }) => {
    // Here we're sure that the user that is performing this operation is an admin.
    await deleteUserFromDb(userId);
  });
```

If a regular user tries to do the same, the execution will be stopped at the last middleware function, defined at the action level, that checks the user role.

---

## `middlewareFn` arguments

- `clientInput`: the raw input (not parsed) passed from client.
- `bindArgsClientInputs`: the raw array of bind arguments inputs (not parsed).
- `ctx`: type safe context value from previous middleware function(s).
- `metadata`: metadata for the action.
- `next` function that will execute the next function in the middleware stack or the server code function. You can opionally extend the `ctx` inside of it.

## `middlewareFn` return value

`middlewareFn` returns a Promise of a `MiddlewareResult` object. It extends the result of a safe action with `success` property, and `parsedInput`, `bindArgsParsedInputs` and `ctx` optional properties. This is the exact return type of the `next` function, so you must always return it (or its result) to continue executing the middleware chain.

## Extend context

Context is a special object that holds information about the current execution state. This object is passed to middleware functions and server code functions when defining actions.

Starting from version 7.6.0, context is extended by default when defining middleware functions. For instance, if you want both the `sessionId` and `userId` in the context, by using two different middleware functions (trivial example), you can do it like this:

```typescript title="src/lib/safe-action.ts"
import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient()
  .use(async ({ next }) => {
    const sessionId = await getSessionId();
    return next({ ctx: { sessionId } })
  })
  .use(async ({ next, ctx }) => {
    const { sessionId } = ctx; // Context contains `sessionId`
    const userId = await getUserIdBySessionId(sessionId);
    return next({ ctx: { userId } })
  })
  .use(async ({ next }) => {
    // You can also define a middleware function that doesn't extend or modify the context.
    return next();
  })
```

And then use the client to define an action:

```typescript title="src/app/test-action.ts"
"use server";

import { actionClient } from "@/lib/safe-action";

export const testAction = actionClient
  .action(async ({ ctx }) => {
    // Context contains `sessionId` and `userId` thanks to the middleware.
    // highlight-next-line
    const { sessionId, userId } = ctx;
  });
```

## Create standalone middleware

:::info
Since version 7.7.0, this API is stable, so it was renamed from `experimental_createMiddleware` to `createMiddleware`.
:::

Starting from version 7.6.0, you can create standalone middleware functions using the built-in `createMiddleware()` function.

Thanks to this feature, and the previously mentioned [context extension](#extend-context), you can now define standalone middleware functions and even publish them as packages, if you want to.

Here's how to use `createMiddleware()`:

```typescript title="src/lib/safe-action.ts"
import { createSafeActionClient, createMiddleware } from "next-safe-action";
import { z } from "zod";

export const actionClient = createSafeActionClient({
  defineMetadataSchema: () => z.object({
    actionName: z.string(),
  }),
  handleReturnedServerError: (e) => ({
    message: e.message,
  }),
}).use(async ({ next }) => {
  return next({ ctx: { foo: "bar" } });
});

// This middleware works with any client.
// highlight-start
const myMiddleware1 = createMiddleware().define(async ({ next }) => {
  // Do something useful here...
  return next({ ctx: { baz: "qux" } });
});
// highlight-end

// This middleware works with clients that at minimum have `ctx.foo`, `metadata.actionName`
// and `serverError.message` properties. More information below. *
// highlight-start
const myMiddleware2 = createMiddleware<{
  ctx: { foo: string }; // [1]
  metadata: { actionName: string }; // [2]
  serverError: { message: string } // [3]
}>().define(async ({ next }) => {
  // Do something useful here...
  return next({ ctx: { john: "doe" } });
});
// highlight-end

// You can use it like a regular middleware function.
export const actionClientWithMyMiddleware = actionClient.use(myMiddleware1).use(myMiddleware2);
```

An action defined using the `actionClientWithMyMiddleware` will contain `foo`, `baz` and `john` in its context.

\* Note that you can pass, **but not required to**, an object with two generic properties to the `createMiddleware()` function: `ctx` \[1\], `metadata` \[2\] and `serverError` \[3\]. Those keys are optional, and you should only provide them if you want your middleware to require **at minimum** the shape you passed in as generic. By doing that, following the above example, you can then access `ctx.foo` and `metadata.actionName` in the middleware you're defining, and by awaiting the `next` function you'll see that `serverError` is an object with the `message` property. If you pass a middleware that requires those properties to a client that doesn't have them, you'll get an error in `use()` method.