---
sidebar_position: 7
description: Action utils is an object with useful properties and callbacks functions that you can use to customize the action execution flow.
---

# Action utils

Action utils is an object with some useful properties and callbacks passed as the second argument of the [`action()`/`stateAction()`](/docs/define-actions/instance-methods#action--stateaction) method.

## Throw errors when they occur

Starting from v7.4.0, you can now pass optional `throwServerError` and `throwValidationErrors` properties at the action level, if you want or need that behavior. Note that the `throwValidationErrors` property set at the action level has a higher priority than the one at the instance level, so if you set it to `false` while the one at the instance level is `true`, validation errors will **not** be thrown.

### Note on `throwValidationErrors`

This property can be set either to a boolean value, or to an object that contains an `overrideErrorMessage()` function. If the `overrideErrorMessage()` function is provided, when validation errors occur, they will be passed to it as the first argument. The function must return a string, that will be used as the error message on the client, instead of the default one.

## Action callbacks

- `onSuccess()`: called when action execution succeeds.
- `onError()`: called when action execution fails (validation errors or server error).
- `onNavigation()`: called when a `next/navigation` function is called in a middleware function or in the action's server code function.
- `onSettled()`: called when action execution succeeds, fails or navigates.

With action callbacks you can perform custom logic after the action is executed, on the server side. You can pass them to [`action()`/`stateAction()`](/docs/define-actions/instance-methods#action--stateaction) method as the second argument, after the server code function. Their return value is not used and they **must** be async functions.

```tsx
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";

const action = actionClient
  .inputSchema(z.object({ test: z.string() }))
  .action(async () => {
    // ...
  }, {
    onSuccess: async ({
      data,
      ctx,
      metadata,
      clientInput,
      bindArgsClientInputs,
      parsedInput,
      bindArgsParsedInputs,
    }) => {},
    onError: async ({
      error,
      ctx,
      metadata,
      clientInput,
      bindArgsClientInputs
    }) => {},
    onNavigation: async ({
      ctx,
      navigationKind,
      metadata,
      clientInput,
      bindArgsClientInputs,
    }) => {},
    onSettled: async ({
      result,
      ctx,
      metadata,
      clientInput,
      bindArgsClientInputs,
      navigationKind,
    }) => {},
  });
```