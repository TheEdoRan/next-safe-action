---
sidebar_position: 2
description: Learn how to use the `useOptimisticAction` hook.
---

# `useOptimisticAction`

:::info
`useOptimisticAction` **does not wait** for the action to finish execution before returning the optimistic data. It is then synced with the real result from server when the action has finished its execution. If you need to perform normal mutations, use [`useAction`](/docs/usage/client-components/hooks/useaction) instead.
:::

:::caution warning
This hook  uses an experimental hook from React called `useOptimistic` under the hood. For this reason, you might experience some bugs and breaking changes in the future.
:::


Let's say, you want to update the number of likes of a post in your application, mutating directly the database.

### Example

1. Define a new action called `addLikes`, that takes an amount as input and returns the updated number of likes:

```typescript title=src/app/add-likes-action.ts
const schema = z.object({
  amount: z.number().positive(),
});

// Fake database.
let likes = 42;
export const getLikes = () => likes;

export const addLikes = actionClient
  .schema(schema)
  .action(async ({ parsedInput: { amount } }) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mutate data in fake db. This would be a database call in the real world.
    likes += amount;

    // We use this function to revalidate server state.
    // More information about it here:
    // https://nextjs.org/docs/app/api-reference/functions/revalidatePath
    revalidatePath("/");

    return { numOfLikes: likes };
});
```

2. Then, in your Server Component, you need to pass the current number of likes to the Client Component:

```tsx title=src/app/page.tsx
export default function Home() {
  return (
    <main>
      {/* Here we pass current number of likes to the Client Component.
      This is updated on the server every time the action is executed, since we
      used `revalidatePath()` inside action's server code. */}
      <AddLikes numOfLikes={getLikes()} />
    </main>
  );
}
```

3. Finally, in your Client Component, you can use it like this:

```tsx title=src/app/add-likes.tsx
import { useOptimisticAction } from "next-safe-action/hooks";
import { addLikes } from "@/app/add-likes-action";

type Props = {
  numOfLikes: number;
}

export default function AddLikes({ numOfLikes }: Props) {
  const { execute, result, optimisticData } = useOptimisticAction(
    addLikes,
    { numOfLikes },
    (state, { amount }) => {
      return { numOfLikes: state.numOfLikes + amount };
    }
  );

  return (
    <div>
      <button
        onClick={() => {
          execute({ amount: 3 });
        }}>
        Add 3 likes
      </button>
      {/* Optimistic state gets updated immediately, it doesn't wait for the server to respond. */}
      <pre>Optimistic state: {optimisticData.numOfLikes}</pre>

      {/* Here's the actual server response. */}
      <pre>Result: {JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
```

### `useOptimisticAction` arguments

`useOptimisticAction` has the following arguments:

| Name             | Type                                                                  | Purpose                                                                                                                                                                                                                                               |
|------------------|-----------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `safeActionFn`     | [`SafeActionFn`](/docs/types#safeactionfn)                                | This is the action that will be called when you use `execute` from hook's return object.                                                                                                                                                              |
| `initialOptimisticData` | `Data` (return type of the `safeActionFn` you passed as first argument) | An initializer for the optimistic state. Usually this value comes from the parent Server Component.                                                                                                                                                   |
| `reducer`        | `(state: Data, input: InferIn<S>) => Data`                      | When you call the action via `execute`, this function determines how the optimistic update is performed. Basically, here you define what happens **immediately** after `execute` is called, and before the actual result comes back from the server.  |
| `callbacks?`     | [`HookCallbacks`](/docs/types#hookcallbacks)                          | Optional callbacks. More information about them [here](/docs/usage/client-components/hooks/callbacks).                                                                                                                                                      |


### `useOptimisticAction` return object

`useOptimisticAction` returns an object with the following properties:

| Name             | Type                                                                  | Purpose                                                                                                                                                                                                                                   |
|------------------|-----------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `execute`        | `(input: InferIn<S>) => void`                                    | An action caller with no return. The input is the same as the safe action you passed to the hook.                                                                                                                                         |
| `result`         | [`HookResult`](/docs/types#hookresult)                                | When the action gets called via `execute`, this is the result object.                                                                                                                                                                     |
| `status`         | [`HookActionStatus`](/docs/types#hookresult)                          | The action current status.                                                                                                                                                                                                                |
| `reset`          | `() => void`                                                          | You can programmatically reset the `result` object with this function.                                                                                                                                                                    |
| `optimisticData` | `Data` (return type of the `safeActionFn` you passed as first argument) | This is the data that gets updated immediately after `execute` is called, with the behavior you defined in the `reducer` function hook argument. The initial state is what you provided to the hook via `initialOptimisticData` argument. |

Explore a working example [here](https://github.com/TheEdoRan/next-safe-action/tree/main/packages/example-app/src/app/(examples)/optimistic-hook).