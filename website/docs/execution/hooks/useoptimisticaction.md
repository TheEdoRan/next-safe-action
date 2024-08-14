---
sidebar_position: 2
description: Learn how to use the useOptimisticAction hook.
---

# `useOptimisticAction`

:::info
`useOptimisticAction` **does not wait** for the action to finish execution before returning the optimistic data. It is then synced with the real result from server when the action has finished its execution. If you need to perform normal mutations, use [`useAction`](/docs/execution/hooks/useaction) instead.
:::

Let's say you have some todos in your database and want to add a new one. The following example shows how you can use `useOptimisticAction` to add a new todo item optimistically.

### Example

1. Define a new action called `addTodo`, that takes a `Todo` object as input:

```typescript title=src/app/addtodo-action.ts
"use server";

import { action } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  id: z.string().uuid(),
  body: z.string().min(1),
  completed: z.boolean(),
});

export type Todo = z.infer<typeof schema>;

let todos: Todo[] = [];
export const getTodos = async () => todos;

export const addTodo = action
  .metadata({ actionName: "" })
  .schema(schema)
  .action(async ({ parsedInput }) => {
    await new Promise((res) => setTimeout(res, 500));

    todos.push(parsedInput);

    // This Next.js function revalidates the provided path.
    // More info here: https://nextjs.org/docs/app/api-reference/functions/revalidatePath
    revalidatePath("/optimistic-hook");

    return {
      createdTodo: parsedInput,
    };
  });

```

2. Then, in the parent Server Component, you need to pass the current todos state to the Client Component:

```tsx title=src/app/page.tsx
import { getTodos } from "./addtodo-action";

export default function Home() {
  return (
    <main>
      {/* Here we pass current todos to the Client Component.
      This is updated on the server every time the action is executed, since we
      used `revalidatePath()` inside action's server code. */}
      <TodosBox todos={getTodos()} />
    </main>
  );
}
```

3. Finally, in your Client Component, you can use it like this:

```tsx title=src/app/todos-box.tsx
"use client";

import { useOptimisticAction } from "next-safe-action/hooks";
import { addTodo, type Todo } from "@/app/addtodo-action";

type Props = {
  todos: Todo[];
};

export default function TodosBox({ todos }: Props) {
  const { execute, result, optimisticState } = useOptimisticAction(
    addTodo,
    {
      currentState: { todos }, // gets passed from Server Component
      updateFn: (state, newTodo) => {
        return { 
          todos: [...state.todos, newTodo] 
        };
      }
    }
  );

  return (
    <div>
      <button
        onClick={() => {
          // Here we execute the action. The input is also passed to `updateFn` as the second argument,
          // in this case `newTodo`.
          execute({ id: crypto.randomUUID(), body: "New Todo", completed: false });
        }}>
        Add todo
      </button>
      {/* Optimistic state gets updated immediately, it doesn't wait for the server to respond. */}
      <pre>Optimistic state: {optimisticState}</pre>
    </div>
  );
}
```

### `useOptimisticAction` arguments

`useOptimisticAction` has the following arguments:

| Name                    | Type                                                                    | Purpose                                                                                                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `safeActionFn`          | [`HookSafeActionFn`](/docs/types#hooksafeactionfn)                              | This is the action that will be called when you use `execute` from hook's return object.                                                                                                                                                             |
| `utils`            | `{ currentState: State; updateFn: (state: State, input: InferIn<S>) => State }` `&` [`HookBaseUtils`](/docs/types#hookbaseutils) `&` [`HookCallbacks`](/docs/types#hookcallbacks)                             | Object with required `currentState`, `updateFn` and optional base utils and callbacks. See below for more information.                                                                                                                                              |

`utils` properties in detail:

| Name                    | Type                                                                    | Purpose                                                                                                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `currentState` | `State` (generic) | An optimistic state setter. This value should come from the parent Server Component.                                                                                                                                                  |
| `updateFn`               | `(state: State, input: InferIn<S>) => State`                              | When you call the action via `execute`, this function determines how the optimistic state update is performed. Basically, here you define what happens **immediately** after `execute` is called, and before the actual result comes back from the server (after revalidation). |
| \-            | [`HookBaseUtils`](/docs/types#hookbaseutils)                            | Optional base utilities. More information about them [here](/docs/execution/hooks/hook-base-utils).                                                                                                                                               |
| \-            | [`HookCallbacks`](/docs/types#hookcallbacks)                            | Optional callbacks. More information about them [here](/docs/execution/hooks/hook-callbacks).                                                                                                                                               |

### `useOptimisticAction` return object

`useOptimisticAction` returns an object with the following properties:

| Name             | Type                                                                    | Purpose                                                                                                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `execute`        | `(input: InferIn<S>) => void`                                           | An action caller with no return. The input is the same as the safe action you passed to the hook.                                                                                                                                         |
| `executeAsync` | `(input: InferIn<S>) => Promise<Awaited<ReturnType<typeof safeActionFn>>>`                | An action caller that returns a promise with the return value of the safe action. The input is the same as the safe action you passed to the hook. |
| `input`  | `InferIn<S> \| undefined`       | The input passed to the `execute` function.                             |
| `result`         | [`HookResult`](/docs/types#hookresult)                                  | When the action gets called via `execute`, this is the result object.                                                                                                                                                                     |
| `optimisticState` | `State` | This contains the state that gets updated immediately after `execute` is called, with the behavior you defined in the `updateFn` function. The initial state is what you provided to the hook via `currentState` argument. If an error occurs during action execution, the `optimisticState` reverts to the state that it had pre-last-last  action execution. |
| `reset`   | `() => void`                                 | Programmatically reset `input` and `result` object with this function.                            |
| `status`         | [`HookActionStatus`](/docs/types#hookresult)                            | The action current status.                                                                                                                                                                                                                |
| `isIdle`  | `boolean` | True if the action status is `idle`.                                                                        |
| `isTransitioning`  | `boolean` | True if the transition status  from the `useTransition` hook used under the hood is `true`.                                                                        |
| `isExecuting`  | `boolean` | True if the action status is `executing`.                                                                        |
| `isPending`  | `boolean` | True if either `isTransitioning` or `isExecuting` are `true`.                                                                        |
| `hasSucceeded`  | `boolean` | True if the action status is `hasSucceeded`.                                                                        |
| `hasErrored`  | `boolean` | True if the action status is `hasErrored`.                                                                        |

Explore a working example [here](<https://github.com/TheEdoRan/next-safe-action/tree/main/apps/playground/src/app/(examples)/optimistic-hook>).
