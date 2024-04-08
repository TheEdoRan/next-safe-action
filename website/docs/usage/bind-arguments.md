---
sidebar_position: 4
description: Learn how to pass additional arguments to your actions.
---

# Bind arguments

Next.js allows you to [pass additional arguments to your actions by using the `bind` method](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#passing-additional-arguments). This method enables Progressive Enhancement.

next-safe-action exposes a [`bindArgsSchemas` method](/docs/safe-action-client/instance-methods#bindargsschemas) that expects an array of schemas for bind arguments.

For example, here we're going to define an `onboardUser` action that has `userId` and `age` as bind arguments and an object with an `username` property as the main argument:

```typescript title="src/app/onboard-action.ts"
"use server";

import { action } from "@/lib/safe-action";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(3).max(30),
});

export const onboardUser = action
  .metadata({ actionName: "onboardUser" })
  .schema(schema)
  // We can pass a named tuple type here, to get named parameters in the final function.
  .bindArgsSchemas<[userId: z.ZodString, age: z.ZodNumber]>([
    z.string().uuid(),
    z.number().min(18).max(150),
  ])
  .define(
    async ({
      parsedInput: { username },
      bindArgsParsedInputs: [userId, age],
    }) => {
      await new Promise((res) => setTimeout(res, 1000));

      return {
        message: `Welcome on board, ${username}! (age = ${age}, user id = ${userId})`,
      };
    }
  );
```

Then, we can use it like this inside a component:

```typescript title="src/app/onboard/page.tsx"
"use client";

import { useAction } from "next-safe-action/hooks";
import { onboardUser } from "./onboard-action";

export default function OnboardPage() {
  // Here we bind `userId` and `age` to `onboardUser`.
  // `boundOnboardUser` will have just `{ username: string }` as its argument, after this `bind` call.
  const boundOnboardUser = onboardUser.bind(null, "d3a96f0f-e509-4f2f-b7d0-cdf50f0dc772", 30);
  const { execute, result, status, reset } = useAction(boundOnboardUser);

  // ...
}
```