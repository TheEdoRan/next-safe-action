---
sidebar_position: 3
description: Action utils is an object with useful properties and callbacks functions that you can use to customize the action execution flow.
---

# Action utils

Action utils is an object with some useful properties and callbacks passed as the second argument of the [`action`/`stateAction`](/docs/safe-action-client/instance-methods#action--stateaction) method.

## Throw errors when they occur

Starting from v7.4.0, you can now pass optional `throwServerError` and `throwValidationErrors` properties at the action level, if you want or need that behavior. Note that the `throwValidationErrors` property set at the action level has a higher priority than the one at the instance level, so if you set it to `false` while the one at the instance level is `true`, validation errors will **not** be thrown.


## Callbacks

With action callbacks you can perform custom logic after the action is executed, on the server side. You can provide them to [`action`/`stateAction`](/docs/safe-action-client/instance-methods#action--stateaction) method in the second argument, after the server code function:

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
    onError: ({
      error,
      ctx,
      metadata,
      clientInput,
      bindArgsClientInputs
    }) => {},
    onSettled: ({
      result,
      ctx,
      metadata,
      clientInput,
      bindArgsClientInputs,
      hasRedirected,
      hasNotFound
    }) => {},
  });
```

Here is the list of callbacks, with their behavior explained. All of them are optional and have return type `void` or `Promise<void>` (async or non-async functions with no return):

| Name         | Executed after                                                           |
| ------------ | -----------------------------------------------------------------------  |
| `onSuccess?` | Action succeeded                                                         |
| `onError?`   | Action errored with server or validation error(s)                        |
| `onSettled?` | Action succeeded or errored                                              |