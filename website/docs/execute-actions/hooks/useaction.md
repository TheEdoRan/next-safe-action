---
sidebar_position: 1
description: Learn how to use the useAction hook.
---

# `useAction`

:::info
`useAction` **waits** for the action to finish execution before returning the result. If you need to perform optimistic updates, use [`useOptimisticAction`](/docs/execute-actions/hooks/useoptimisticaction) instead.
:::

With this hook, you get full control of the action execution flow.
Let's say, for instance, you want to change what's displayed by a component when a button is clicked.

### Example

1. Define a new action called `greetUser`, that takes a name as input and returns a greeting:

```typescript title=src/app/greet-action.ts
"use server";

const schema = z.object({
  name: z.string(),
});

export const greetUser = actionClient
  .schema(schema)
  .action(async ({ parsedInput: { name } }) => {
    return { message: `Hello ${name}!` };
  });
```

2. In your Client Component, you can use it like this:

```tsx title=src/app/greet.tsx
"use client";

import { useAction } from "next-safe-action/hooks";
import { greetUser } from "@/app/greet-action";

export default function Greet() {
  const [name, setName] = useState("");
  // highlight-next-line
  const { execute, result } = useAction(greetUser);

  return (
    <div>
      <input type="text" onChange={(e) => setName(e.target.value)} />
      <button
        onClick={() => {
          // highlight-next-line
          execute({ name });
        }}>
        Greet user
      </button>
      {result.data?.message ? <p>{result.data.message}</p> : null}
    </div>
  );
}
```

As you can see, here we display a greet message after the action is performed, if it succeeds.

### `useAction` arguments

- `safeActionFn`: the safe action that will be called via `execute` or `executeAsync` functions.
- `utils?`: object with [callbacks](/docs/execute-actions/hooks/hook-callbacks).

### `useAction` return object

- `execute`: an action caller with no return. Input is the same as the safe action you passed to the hook.
- `executeAsync`: an action caller that returns a promise with the return value of the safe action. Input is the same as the safe action you passed to the hook.
- `input`: the input passed to the `execute` or `executeAsync` function.
- `result`: result of the action after its execution.
- `reset`: programmatically reset execution state (`input`, `status` and `result`).
- `status`: string that represents the current action status.
- `isIdle`: true if the action status is `idle`.
- `isTransitioning`: true if the transition status  from the `useTransition` hook used under the hood is `true`.
- `isExecuting`: true if the action status is `executing`.
- `isPending`: true if the action status is `executing` or `isTransitioning`.
- `hasSucceeded`: true if the action status is `hasSucceeded`.
- `hasErrored`: true if the action status is `hasErrored`.

For checking the action status, the recommended way is to use the `isPending` shorthand property. Using `isExecuting` or checking if `status` is `"executing"` could cause race conditions when using navigation functions, such as `redirect`.

Explore a working example [here](<https://github.com/TheEdoRan/next-safe-action/tree/main/apps/playground/src/app/(examples)/hook>).
