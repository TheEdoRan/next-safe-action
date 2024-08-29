---
sidebar_position: 2
description: Learn how to use next-safe-action with form actions.
---

# Form actions

You can utilize Server Actions as form actions too. next-safe-action allows you to define _stateful_ or _stateless_ form actions.

### `FormData` input

For defining actions with `FormData` input, the recommended approach is to use the [`zod-form-data`](https://www.npmjs.com/package/zod-form-data) library, which allows you to do that. In these two examples below we'll be using it.

## Stateless form actions

You can define a _stateless_ safe action using the [`action`](/docs/define-actions/instance-methods#action--stateaction) instance method, and then pass it to the `action` prop of a form using [`direct execution`](/docs/execute-actions/direct-execution), [`useAction`](/docs/execute-actions/hooks/useaction) hook or [`useOptimisticAction`](/docs/execute-actions/hooks/useoptimisticaction) hook.

With this method, you can access previous result from the client component, both by awaiting the safe action or by using the `result` prop returned by the hooks. You can't access previous result on the server, though, and this is why this approach is called _stateless_: the server doesn't know the previous result of the action execution.

Here's an example using the `useAction` hook:

```typescript title="stateless-form-action.ts"
"use server";

import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { zfd } from "zod-form-data";

const schema = zfd.formData({
  name: zfd.text(z.string().min(1).max(20)),
});

export const statelessFormAction = actionClient
  .schema(schema)
  // highlight-start
  .action(async ({ parsedInput }) => {
    await new Promise((res) => setTimeout(res, 1000));

    return {
      newName: parsedInput.name,
    };
  });
  // highlight-end
```

```tsx title="stateless-form.tsx"
"use client";

import { useAction } from "next-safe-action/hooks";
import { statelessFormAction } from "./stateless-form-action";

export default function StatelessForm() {
  // highlight-next-line
  const { execute } = useAction(statelessFormAction);

  return (
    // highlight-next-line
    <form action={execute}>
      <input type="text" name="name" placeholder="Name" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

You can also find this example in the playground app: [stateless form action](https://github.com/TheEdoRan/next-safe-action/tree/main/apps/playground/src/app/(examples)/stateless-form) example.

## Stateful form actions

You can define a _stateful_ safe action using the [`stateAction`](/docs/define-actions/instance-methods#action--stateaction) instance method, and then pass it to the `action` prop of a form using the [`useStateAction`](/docs/execute-actions/hooks/usestateaction) hook.

With this method, you can access previous result both from the client component, by using the `result` prop returned by the hook, and on the server, where you define the action. More information about that in the [`stateAction`](/docs/define-actions/instance-methods#action--stateaction) and [`useStateAction`](/docs/execute-actions/hooks/usestateaction) sections.



Note that if you want or need to use _stateful_ actions:
1. You **must** define them with [`stateAction`](/docs/define-actions/instance-methods#action--stateaction) instance method. This changes the signature of the Server Action function, placing the `prevResult` as the first argument.
2. If you're on Next.js < 15, you can manually pass them to `useFormState` hook, which will be deprecated.
3. Starting from Next.js 15, you **should** use the built-in `useStateAction` hook (which uses React's [`useActionState`](https://react.dev/reference/react/useActionState) hook under the hood) exported from `next-safe-action/stateful-hooks` path.

Here's an example of a stateful action, using the `useStateAction` hook:

```typescript title="stateful-form-action.ts"
"use server";

import { action } from "@/lib/safe-action";
import { z } from "zod";
import { zfd } from "zod-form-data";

const schema = zfd.formData({
  name: zfd.text(z.string().min(1).max(20)),
});

// Note that we need to explicitly give a type to `stateAction` here, for its return object.
// This is because TypeScript can't infer the return type of the function and then "pass it" to
// the second argument of the server code function (`prevResult`). If you don't need to access `prevResult`,
// though, you can omit the type here, since it will be inferred just like with `action` method.
export const statefulFormAction = action
  .schema(schema)
  // highlight-start
  .stateAction<{
    prevName?: string;
    newName: string;
  }>(async ({ parsedInput }, { prevResult }) => {
    return {
      prevName: prevResult.data?.newName,
      newName: parsedInput.name,
    };
  });
  // highlight-end
```

```tsx title="stateful-form.tsx"
"use client";

import { useStateAction } from "next-safe-action/stateful-hooks";
import { statefulFormAction } from "./stateful-form-action";

export default function StatefulForm() {
  // highlight-start
  const { execute } = useStateAction(
    statefulFormAction,
    {
      initResult: { data: { newName: "jane" } }, // optionally pass initial state
    }
  );
  // highlight-end

  return (
    // highlight-next-line
    <form action={execute}>
      <input type="text" name="name" placeholder="Name" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

You can also find this example in the playground app: [stateful form action](https://github.com/TheEdoRan/next-safe-action/tree/main/apps/playground/src/app/(examples)/stateful-form) example.