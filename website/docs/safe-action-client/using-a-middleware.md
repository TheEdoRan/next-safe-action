---
sidebar_position: 1
description: Learn how to use a middleware in your client to perform custom logic before action server code is executed.
---

# Using a middleware

You can provide a middleware to the safe action client to perform custom logic before action server code is executed, but after input from the client is validated.

So, let's say, you want to be sure that the user is authenticated before executing an action. In this case, you would create an `authAction` client and check if the user session is valid:

```typescript title=src/lib/safe-action.ts
import { createSafeActionClient } from "next-safe-action";
import { cookies } from "next/headers";
import { getUserIdFromSessionId } from "./db";

export const authAction = createSafeActionClient({
  // Can also be a non async function.
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

As you can see, you can use the `cookies()` and `headers()` functions from `next/headers` to get cookie values and request headers. You can also delete/manipulate cookies in the middleware (since it is part of a Server Action execution), and safely throw an error, that will be caught by the client and returned to the client as a `serverError` result.

Middleware can also be used to return a context, that will be passed as the second argument of the action server code function. This is very useful if you want, for example, find out which user executed the action. Here's an example reusing the `authAction` client defined above:

```typescript title=src/app/send-message-action.ts
import { authAction } from "@/lib/safe-action";
import { z } from "zod";
import { createMessage } from "./db";

const schema = z.object({
  text: z.string(),
});

//                                      This comes from middleware return object (context).
//                                                         \\
const sendMessage = authAction(schema, async ({ text }, { userId }) => {
  // Fake db call, this function creates a new message in the database, we know
  // the user id thanks to the context injected by the middleware function.
  const messageId = createMessage(userId, text);
  return { messageId };
});
```

If the user session is not valid this server code is never executed. So in this case, we're sure the user is authenticated.