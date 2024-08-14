---
sidebar_position: 1
description: Learn how to use the useAction hook.
---

# `useAction`

:::info
`useAction` **waits** for the action to finish execution before returning the result. If you need to perform optimistic updates, use [`useOptimisticAction`](/docs/execution/hooks/useoptimisticaction) instead.
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
  const { execute, result } = useAction(greetUser);

  return (
    <div>
      <input type="text" onChange={(e) => setName(e.target.value)} />
      <button
        onClick={() => {
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

`useAction` has the following arguments:

| Name           | Type                                       | Purpose                                                                                                |
| -------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `safeActionFn` | [HookSafeActionFn](/docs/types#hooksafeactionfn)   | This is the action that will be called when you use `execute` from hook's return object.               |
| `utils?`   | [`HookBaseUtils`](/docs/types#hookbaseutils) `&` [`HookCallbacks`](/docs/types#hookcallbacks) | Optional [base utils](/docs/execution/hooks/hook-base-utils) and [callbacks](/docs/execution/hooks/hook-callbacks). |

### `useAction` return object

`useAction` returns an object with the following properties:

| Name      | Type                                         | Purpose                                                                                           |
| --------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `execute` | `(input: InferIn<S>) => void`                | An action caller with no return. The input is the same as the safe action you passed to the hook. |
| `executeAsync` | `(input: InferIn<S>) => Promise<Awaited<ReturnType<typeof safeActionFn>>>`                | An action caller that returns a promise with the return value of the safe action. The input is the same as the safe action you passed to the hook. |
| `input`  | `InferIn<S> \| undefined`       | The input passed to the `execute` function.                             |
| `result`  | [`HookResult`](/docs/types#hookresult)       | When the action gets called via `execute`, this is the result object.                             |
| `reset`   | `() => void`                                 | Programmatically reset `input` and `result` object with this function.                            |
| `status`  | [`HookActionStatus`](/docs/types#hookresult) | The action current status.                                                                        |
| `isIdle`  | `boolean` | True if the action status is `idle`.                                                                        |
| `isTransitioning`  | `boolean` | True if the transition status  from the `useTransition` hook used under the hood is `true`.                                                                        |
| `isExecuting`  | `boolean` | True if the action status is `executing`.                                                                        |
| `isPending`  | `boolean` | True if either `isTransitioning` or `isExecuting` are `true`.                                                                        |
| `hasSucceeded`  | `boolean` | True if the action status is `hasSucceeded`.                                                                        |
| `hasErrored`  | `boolean` | True if the action status is `hasErrored`.                                                                        |

Explore a working example [here](<https://github.com/TheEdoRan/next-safe-action/tree/main/apps/playground/src/app/(examples)/hook>).
