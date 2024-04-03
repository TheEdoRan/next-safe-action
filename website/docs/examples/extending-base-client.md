---
sidebar_position: 3
description: Learn how to use both a basic and an authorization client at the same time in your project.
---


# Extending a base client

A common and recommended pattern with this library is to extend the base safe action client, to cover different use cases that you might want and/or need in your applicaton.

The most simple case that comes to mind is to define a base client for unauthenticated actions, and then extend it to create a client for authenticated actions, thanks to an authorization middleware:

```typescript title="src/lib/safe-action.ts"
import { createSafeActionClient } from "next-safe-action";
import { cookies } from "next/headers";
import { getUserIdFromSessionId } from "./db";

// This is our base client.
// Here we define a middleware that logs the result of the action execution.
export const actionClient = createSafeActionClient().use(async ({ next }) => {
  const result = await next({ ctx: null });
  console.log("LOGGING MIDDLEWARE: result ->", result);
  return result;
});

// This client extends the base one and ensures that the user is authenticated before running
// action server code function. Note that by extending the base client, you don't need to
// redeclare the logging middleware, is will simply be inherited by the new client.
export const authActionClient = actionClient
  // Clone the base client to extend this one with additional middleware functions.
  .clone()
  // In this case, context is used for (fake) auth purposes.
  .use(async ({ next }) => {
    const session = cookies().get("session")?.value;

    // If the session is not found, we throw an error and stop execution here.
    if (!session) {
      throw new Error("Session not found!");
    }

    // In the real world, you would check if the session is valid by querying a database.
    // We'll keep it very simple here.
    const userId = await getUserIdFromSessionId(session);

    // If the session is not valid, we throw an error and stop execution here.
    if (!userId) {
      throw new Error("Session is not valid!");
    }

    // Here we return the context object for the next middleware in the chain/server code function.
    return next({
      ctx: {
        userId,
      },
    });
  });
```