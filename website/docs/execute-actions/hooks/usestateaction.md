---
title: useStateAction() [DEPRECATED]
sidebar_position: 3
description: Learn how to use the useStateAction hook.
---

# ~~`useStateAction()`~~

:::warning deprecation notice
The `useStateAction()` hook is deprecated since version 8. Directly use the [`useActionState()`](https://react.dev/reference/react/useActionState) hook from React instead.
:::

### `useStateAction()` documentation

You can access the documentation for the deprecated `useStateAction()` hook in the [v7 docs](https://v7.next-safe-action.dev/docs/execute-actions/hooks/usestateaction).

### From v8 onwards

The `useStateAction()` hook has been deprecated in favor of the [`useActionState`](https://react.dev/reference/react/useActionState) hook from React, which was used under the hood. This is because the usage of `useStateAction`, while adding useful features, prevented progressive enhancement from working, since it wrapped the `useActionState` hook with additional functionality that only worked with JavaScript enabled.

Note that you can also use "stateless" actions with forms, as described in [this section](/docs/recipes/form-actions#stateless-form-actions).

### Example

1. Define a new stateful action called `statefulAction`, that takes a name as input and returns the name you just passed, as well as the previous one (if any).

Note two important things: 
  1. We're defining an action that will be used as a Form Action, so here we use the [`zod-form-data`](https://www.npmjs.com/package/zod-form-data) library to generate the input validation schema;
  2. We use [`stateAction()`](/docs/define-actions/instance-methods#action--stateaction) instance method to define the action. You **must** use this method, because `useActionState()` hook requires `prevResult` to be the first argument of the Server Action function. Using this method also allows you to access the previous action result in `serverCodeFn`, via the `prevResult` property in the second argument of the function:

```typescript title=src/app/stateful-action.ts
"use server";

import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { zfd } from "zod-form-data";

const inputSchema = zfd.formData({
  name: zfd.text(z.string().min(1).max(20)),
});

export const statefulAction = actionClient
  .metadata({ actionName: "statefulAction" })
  .inputSchema(inputSchema)
  // Note that we need to explicitly give a type to `stateAction` here,
  // for its return object. This is because TypeScript can't infer the
  // return type of the function and then "pass it" to the second argument
  // of the server code function (`prevResult`). If you don't need to
  // access `prevResult`, though, you can omit the type here, since it
  // will be inferred just like with `action` method.
  // highlight-start
  .stateAction<{
    prevName?: string;
    newName: string;
  }>(async ({ parsedInput, metadata }, { prevResult }) => {
    await new Promise((res) => setTimeout(res, 1000));

    return {
      prevName: prevResult.data?.newName,
      newName: parsedInput.name,
    };
  });
  // highlight-end
```

2. Then, in your Client Component, you can define a form like this one, and pass the action we just defined to the form `action` prop:

```tsx
"use client";

import { useActionState } from "react";
import { statefulAction } from "./action";

export function TestForm() {
  // Optionally pass initial state as the second argument.
  // An empty object is required, even if you don't pass any initial state,
  // since it has to match the type of the action's return object.
  // highlight-next-line
  const [state, action, isPending] = useActionState(statefulAction, {});

  return {
    // highlight-next-line
    <form action={action}>
      ...
    </form>
  }
}
```