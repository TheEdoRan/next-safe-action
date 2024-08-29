---
sidebar_position: 7
description: Action utils is an object with useful properties and callbacks functions that you can use to customize the action execution flow.
---

# Action utils

Action utils is an object with some useful properties and callbacks passed as the second argument of the [`action`/`stateAction`](/docs/define-actions/instance-methods#action--stateaction) method.

## Throw errors when they occur

Starting from v7.4.0, you can now pass optional `throwServerError` and `throwValidationErrors` properties at the action level, if you want or need that behavior. Note that the `throwValidationErrors` property set at the action level has a higher priority than the one at the instance level, so if you set it to `false` while the one at the instance level is `true`, validation errors will **not** be thrown.


## Action callbacks

- `onSuccess`: called when action execution succeeds.
- `onError`: called when action execution fails (validation errors or server error).
- `onSettled`: called when action execution succeeds or fails.

With action callbacks you can perform custom logic after the action is executed, on the server side. You can pass them to [`action`/`stateAction`](/docs/define-actions/instance-methods#action--stateaction) method in the second argument, after the server code function. They don't return anything and can be async or not.

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