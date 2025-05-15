---
sidebar_position: 2
description: Learn how to use the useOptimisticAction hook.
---

# `useOptimisticAction()`

:::info
`useOptimisticAction()` **does not wait** for the action to finish execution before returning the optimistic data. It is then synced with the real result from server when the action has finished its execution. If you need to perform normal mutations, use [`useAction()`](/docs/execute-actions/hooks/useaction) instead.
:::

Let's say you have some todos in your database and want to add a new one. The following example shows how you can use `useOptimisticAction()` to add a new todo item optimistically.

### Example

1. Define a new action called `addTodo()`, that takes a `Todo` object as input:

```typescript title=src/app/addtodo-action.ts
"use server";

import { action } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const inputSchema = z.object({
  id: z.string().uuid(),
  body: z.string().min(1),
  completed: z.boolean(),
});

export type Todo = z.infer<typeof inputSchema>;

let todos: Todo[] = [];
export const getTodos = async () => todos;

export const addTodo = action
  .metadata({ actionName: "" })
  .inputSchema(inputSchema)
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
  // highlight-start
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
  // highlight-end

  return (
    <div>
      <button
        onClick={() => {
          // Here we execute the action. The input is also passed to `updateFn` as the second argument,
          // in this case `newTodo`.
          // highlight-next-line
          execute({ id: crypto.randomUUID(), body: "New Todo", completed: false });
        }}>
        Add todo
      </button>
      {/* Optimistic state gets updated right after the `execute()` call (next render), it doesn't wait for the server to respond. */}
      <pre>Optimistic state: {optimisticState}</pre>
    </div>
  );
}
```

### `useOptimisticAction()` arguments

- `safeActionFn`: the safe action that will be called via `execute()` or `executeAsync()` functions.
- `utils`: object with required `currentState` and `updateFn` properties and optional [callbacks](/docs/execute-actions/hooks/hook-callbacks). `currentState` is passed from the parent Server Component, and `updateFn` tells the hook how to update the optimistic state before receiving the server response.

### `useOptimisticAction()` return object

- `execute()`: an action caller with no return. Input is the same as the safe action you passed to the hook.
- `executeAsync()`: an action caller that returns a promise with the return value of the safe action. Input is the same as the safe action you passed to the hook.
- `input`: the input passed to the `execute()` or `executeAsync()` function.
- `result`: result of the action after its execution.
- `optimisticState`: the optimistic state updated right after `execute()` call (on the next render), with the behavior defined in `updateFn`.
- `reset()`: programmatically reset execution state (`input`, `status` and `result`).
- `status`: string that represents the current action status.
- `isIdle`: true if the action status is `idle`.
- `isTransitioning`: true if the transition status  from the `useTransition` hook used under the hood is `true`.
- `isExecuting`: true if the action status is `executing`.
- `hasSucceeded`: true if the action status is `hasSucceeded`.
- `hasErrored`: true if the action status is `hasErrored`.
- `hasNavigated`: true if a `next/navigation` function was called inside the action.

The `executing` status and `isExecuting` shorthand property include the transition state.

Explore a working example [here](<https://github.com/TheEdoRan/next-safe-action/tree/main/apps/playground/src/app/(examples)/optimistic-hook>).
