---
sidebar_position: 3
description: Action callbacks are a way to perform custom logic after the action is executed, on the server.
---

# Action callbacks

With action callbacks you can perform custom logic after the action is executed, on the server side. You can provide them to [`action`/`stateAction`](/docs/safe-action-client/instance-methods#action--stateaction) method as the second argument, after the server code function:

```tsx
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";

const action = actionClient
  .schema(z.object({ test: z.string() }))
  .action(async () => {
    // ...
  }, {
    onSuccess: ({
      data,
      ctx,
      metadata,
      clientInput,
      bindArgsClientInputs,
      parsedInput,
      bindArgsParsedInputs,
      hasRedirected,
      hasNotFound,
    }) => {},
    onError: ({ error, ctx, metadata, clientInput, bindArgsClientInputs }) => {},
    onSettled: ({ result, ctx, metadata, clientInput, bindArgsClientInputs }) => {},
  });
```

Here is the list of callbacks, with their behavior explained. All of them are optional and have return type `void` or `Promise<void>` (async or non-async functions with no return):

| Name         | Executed after                  |
| ------------ | -----------------------------------------------------------------------  |
| `onSuccess?` | Action succeeded
| `onError?`   | Action errored with server or validation error(s)
| `onSettled?` | Action succeeded or errored (after `onSuccess` or `onError` call) |