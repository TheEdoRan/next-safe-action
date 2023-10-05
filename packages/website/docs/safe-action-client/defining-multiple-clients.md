---
sidebar_position: 3
description: Learn how to define multiple clients.
---

# Defining multiple clients

A common and recommended pattern with this library is to define multiple safe action clients, to cover different use cases that you might want and/or need in your applicaton.

The most simple case that comes to mind is to define a client for unauthenticated actions, and one for authenticated actions, but you can define as many clients as you want:

```typescript src=src/lib/safe-action.ts
import { createSafeActionClient } from "next-safe-action";
import { cookies } from "next/headers";
import { getUserIdFromSessionId } from "./db";

// This is our base client.
export const action = createSafeActionClient();

// This client ensures that the user is authenticated before running action server code.
export const authAction = createSafeActionClient({
  // Can also be a normal function.
  async middleware() {
    const session = cookies().get("session")?.value;

    if (!session) {
      throw new Error("Session not found!");
    }

    // In the real world, you would check if the session is valid by querying a database.
    // We'll keep it very simple here.
    const userId = await getUserIdFromSessionId(session);

    if (!userId) {
      throw new Error("Session is not valid!");
    }

    return { userId };
  },
});
```