---
sidebar_position: 1
description: You can execute safe actions by directrly calling them inside Client Components.
---

# 1. Direct execution

The first way to execute Server Actions inside Client Components is by importing it and directly calling it in a function. This method is the simplest one, but in some cases it could be all you need, for example if you just need the action result inside an `onClick` or `onSubmit` handlers, without overcomplicating things.

### Example

1. Define a new action called `loginUser`, that takes a username and a password as input:

```typescript title=src/app/login-action.ts
"use server";

import { actionClient } from "@/lib/safe-action";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(3).max(10),
  password: z.string().min(8).max(100),
});

export const loginUser = actionClient
  .schema(schema)
  .action(async ({ parsedInput: { username, password } }) => {
    // logic here...
  });
```

2. Then, in your Client Component, you can use it like this:

```tsx
"use client";

import { loginUser } from "@/app/login-action";

export default function Login() {
  return (
    <button
      onClick={async () => {
        // Result is scoped to this function.
        const result = await loginUser({
          username: "johndoe",
          password: "123456",
        });

        // You can do something with it here.
      }}>
      Log in
    </button>
  );
}
```

### Action result object

Every action you execute returns an object with the same structure. This is described in the [action result object](/docs/execution/action-result-object) section.

Explore a working example [here](<https://github.com/TheEdoRan/next-safe-action/tree/main/apps/playground/src/app/(examples)/direct>).
