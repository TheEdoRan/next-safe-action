---
sidebar_position: 1
description: Learn how to use the `useAction` hook.
---

# `useAction`

:::info
`useAction` **waits** for the action to finish execution before returning the result. If you need to perform optimistic updates, use [`useOptimisticAction`](/docs/usage/client-components/hooks/useoptimisticaction) instead.
:::

With this hook, you get full control of the action execution flow.
Let's say, for instance, you want to change what's displayed by a component when a button is clicked.

### Example

1. Define a new action called `greetUser`, that takes a name as input and returns a greeting:

```typescript title=src/app/greet-action.ts
const schema = z.object({
  name: z.string(),
});

export const greetUser = action(schema, async ({ name }) => {
  return { message: `Hello ${name}!` };
});
```

2. In your Client Component, you can use it like this:

```tsx title=src/app/greet.tsx
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

| Name         | Type                                       | Purpose                                                                                          |
|--------------|--------------------------------------------|--------------------------------------------------------------------------------------------------|
| `safeAction` | [SafeAction](/docs/types#safeaction)       | This is the action that will be called when you use `execute` from hook's return object.         |
| `callbacks?` | [HookCallbacks](/docs/types#hookcallbacks) | Optional callbacks. More information about them [here](/docs/usage/client-components/hooks/callbacks). |

### `useAction` return object

`useAction` returns an object with the following properties:

| Name      | Type                                         | Purpose                                                                                           |
|-----------|----------------------------------------------|---------------------------------------------------------------------------------------------------|
| `execute` | `(input: InferIn<S>) => void`           | An action caller with no return. The input is the same as the safe action you passed to the hook. |
| `result`  | [`HookResult`](/docs/types#hookresult)       | When the action gets called via `execute`, this is the result object.                             |
| `status`  | [`HookActionStatus`](/docs/types#hookresult) | The action current status.                                                                        |
| `reset`   | `() => void`                                 | You can programmatically reset the `result` object with this function.                            |

Explore a working example [here](https://github.com/TheEdoRan/next-safe-action/tree/main/packages/example-app/src/app/hook).