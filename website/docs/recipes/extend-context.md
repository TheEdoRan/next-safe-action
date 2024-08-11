---
sidebar_position: 4
description: Learn how to extend context when using middleware functions.
---

# Extend context

Context is a special object that holds information about the current execution state. This object is passed to middleware functions and server code functions when defining actions.

Since version 7.6.0, context is extended by default when defining middleware functions. For instance, if you want both the `sessionId` and `userId` in the context, by using two different middleware functions (trivial example), you can do it like this:

```typescript
import { createSafeActionClient } from "next-safe-action";

const actionClient = createSafeActionClient()
  .use(async ({ next }) => {
    const sessionId = await getSessionId();
    return next({ ctx: { sessionId } })
  })
  .use(async ({ next, ctx }) => {
    // Get user id from database.
    const { sessionId } = ctx; // Context contains `sessionId`
    const userId = await getUserIdBySessionId(sessionId);
    return next({ ctx: { userId } })
  })
  .use(async ({ next }) => {
    // You can also define a middleware function that doesn't extend or modify the context.
    return next();
  })
```

All actions defined using this client will contain both `sessionId` and `userId` in their context.