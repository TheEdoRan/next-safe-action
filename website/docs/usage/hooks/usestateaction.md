---
sidebar_position: 3
description: Learn how to use the useStateAction hook.
---

# `useStateAction`

`useStateAction` keeps track of the previous action execution result(s), thanks to the [`useActionState`](https://react.dev/reference/react/useActionState) hook from React that is used under the hood. This hook works with actions declared with the `stateAction` instance method, that changes the function signature, placing a `prevResult` argument in the first position, and an input (if a validation schema was provided) in the second one. When a stateful action is passed to `useStateAction` hook, the returned `execute` function will be a function that accepts just the (optional) input and returns the action result, as the normal `useAction` hook does.

:::note
React's `useActionState` hook has replaced the previous `useFormState` hook, that is now deprecated. You can explore the documentation for it in the [React docs](https://react.dev/reference/react/useActionState).
:::

Let's say you want to update the number of likes of a post in your application, mutating directly the database.

### Example

1. Define a new stateful action called `statefulAction`, that takes a name as input and returns the name you just passed, as well as the previous one (if any).

Note two important things: 
  1. We use the [`zod-form-data`](https://www.npmjs.com/package/zod-form-data) library to generate the input validation schema;
  2. We use [`stateAction`](/docs/safe-action-client/instance-methods#action--stateaction) instance method to define the action. You **must** use this method, because `useStateAction` hook requires `prevResult` to be the first argument of the Server Action function. Using this method also allows you to access the previous action result in `serverCodeFn`, via the `prevResult` property in the second argument of the function:

```typescript title=src/app/stateful-action.ts
"use server";

import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { zfd } from "zod-form-data";

const schema = zfd.formData({
  name: zfd.text(z.string().min(1).max(20)),
});

export const statefulAction = actionClient
  .metadata({ actionName: "statefulAction" })
  .schema(schema)
  // Note that we need to explicitly give a type to `stateAction` here,
  // for its return object. This is because TypeScript can't infer the
  // return type of the function and then "pass it" to the second argument
  // of the server code function (`prevResult`). If you don't need to
  // access `prevResult`, though, you can omit the type here, since it
  // will be inferred just like with `action` method.
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
```

1. Then, in your Client Component, you can define a form like this one, and pass the action we just defined to the form `action` prop:

```tsx title=src/app/stateful-form.tsx
"use client";

import { useStateAction } from "next-safe-action/hooks";
import { statefulAction } from "./stateful-action";

export default function StatefulFormPage() {
  const { execute, result, status } = useStateAction(statefulAction, {
    initResult: { data: { newName: "jane" } }, // optionally pass initial state
  });

  return (
    <form action={execute}>
      <input type="text" name="name" placeholder="Name" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### `useStateAction` arguments

`useStateAction` has the following arguments:

| Name                    | Type                                                                    | Purpose                                                                                                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `safeActionFn`          | [`HookStateSafeActionFn`](/docs/types#hookstatesafeactionfn)                              | This is the action that will be passed to React's `useActionState` hook. You can then all it with `execute` function from the hook's return object, that has the same signature as `safeActionFn`, minus the first argument (`prevResult`).                                                               |
| `utils`            | `{ initResult: Awaited<ReturnType<typeof safeActionFn>>; permalink?: string }` `&` [`HookCallbacks`](/docs/types#hookcallbacks)                            | Object with required `initResult` property and optional [`permalink`] and callbacks. Permalink usage is [explained in React docs](https://react.dev/reference/react/useActionState#parameters) for `useActionState` hook.                                                                                                                                            |

You can pass an optional initial result to `useStateAction`, with the `initResult` argument. If not passed, the init result will default to `EMPTY_HOOK_RESULT` (every property typed `undefined`).


### `useOptimisticAction` return object

`useOptimisticAction` returns an object with the following properties:

| Name             | Type                                                                    | Purpose                                                                                                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `execute`        | `(input: InferIn<S>) => void`                                           | An action caller with no return. The input is the same as the safe action you passed to the hook.                                                                                                                                         |
| `result`         | [`HookResult`](/docs/types#hookresult)                                  | When the action gets called via `execute`, this is the result object.                                                                                                                                                                     |
| `status`         | [`HookActionStatus`](/docs/types#hookresult)                            | The action current status.                                                                                                                                                                                                                |

Explore a working example [here](<https://github.com/TheEdoRan/next-safe-action/tree/main/apps/playground/src/app/(examples)/stateful-form>).
