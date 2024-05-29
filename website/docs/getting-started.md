---
sidebar_position: 2
description: Getting started with next-safe-action version 7.
---

# Getting started

:::info Requirements

- Next.js >= 15
- TypeScript >= 5
- Zod or a validation library supported by [TypeSchema](https://typeschema.com/#coverage)
:::

**next-safe-action** provides a typesafe Server Actions implementation for Next.js App Router.

## Installation

Assuming you want to use Zod as your validation library, use the following command:

```bash npm2yarn
npm i next-safe-action@next zod
```

:::note
Zod is the default validation library for next-safe-action, because TypeSchema can cause some issues with deployments, so this documentation uses it for that reason. If you know what you're doing, though, you can use your validation library of choice, or even multiple ones at the same time, thanks to the **TypeSchema** package.

To use this feature, you just need to update the import path for the safe client initialization function from:
```typescript
import { createSafeActionClient } from "next-safe-action";
```

to:

```typescript
import { createSafeActionClient } from "next-safe-action/typeschema";
```

and install the related [TypeSchema adapter](https://typeschema.com/#coverage).
:::

## Usage

### 1. Instantiate a new client

You can create a new client with the following code:

```typescript title="src/lib/safe-action.ts"
import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient();
```

This is a basic client, without any options or middleware functions. If you want to explore the full set of options, check out the [safe action client](/docs/safe-action-client) section.

### 2. Define a new action

This is how a safe action is created. Providing a validation input schema to the function via [`schema()`](/docs/safe-action-client/instance-methods#schema), we're sure that data that comes in is type safe and validated.
The [`action()`](/docs/safe-action-client/instance-methods#action--stateaction) method lets you define what happens on the server when the action is called from client, via an async function that receives the parsed input and context as arguments. In short, this is your _server code_. **It never runs on the client**:

```typescript title="src/app/login-action.ts"
"use server"; // don't forget to add this!

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";

// This schema is used to validate input from client.
const schema = z.object({
  username: z.string().min(3).max(10),
  password: z.string().min(8).max(100),
});

export const loginUser = actionClient
  .schema(schema)
  .action(async ({ parsedInput: { username, password } }) => {
    if (username === "johndoe" && password === "123456") {
      return {
        success: "Successfully logged in",
      };
    }

    return { failure: "Incorrect credentials" };
  });
```

`action` returns a function that can be called from the client.

### 3. Import and execute the action

In this example, we're **directly** calling the Server Action from a Client Component:

```tsx title="src/app/login.tsx"
"use client"; // this is a Client Component

import { loginUser } from "./login-action";

export default function Login() {
  return (
    <button
      onClick={async () => {
        // Typesafe action called from client.
        const res = await loginUser({
          username: "johndoe",
          password: "123456",
        });

        // Result keys.
        const {
          data,
          validationErrors,
          bindArgsValidationErrors,
          serverError,
        } = res;
      }}>
      Log in
    </button>
  );
}
```

You also can execute Server Actions with hooks, which are a more powerful way to handle mutations. For more information about these, check out the [`useAction`](/docs/execution/hooks/useaction), [`useOptimisticAction`](/docs/execution/hooks/useoptimisticaction) and [`useStateAction`](/docs/execution/hooks/usestateaction) hooks sections.