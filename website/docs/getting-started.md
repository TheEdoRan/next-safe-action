---
sidebar_position: 2
description: Getting started with next-safe-action version 7.
---

# Getting started

:::note
This is the documentation for the current version of the library (7.x.x).
:::

:::info Requirements
- v4: Next.js >= 13.4.2, v5: Next.js >= 14.0.0
- TypeScript >= 5.0.0
- pre-v6: Zod >= 3.0.0, from v6: a validation library supported by [TypeSchema](https://typeschema.com/#coverage)
:::

**next-safe-action** provides a typesafe Server Actions implementation for Next.js App Router.

## Validation libraries support

We will use Zod as our validation library in this documentation, but since version 6 of next-safe-action, you can use your validation library of choice, or even multiple and custom ones at the same time, thanks to the **TypeSchema** library. You can find supported libraries [here](https://typeschema.com/#coverage).

## Installation

For Next.js >= 14, use the following command:

```bash npm2yarn
npm i next-safe-action
```

For Next.js 13, use the following command:

```bash npm2yarn
npm i next-safe-action@v4 zod
```

## Usage

:::note
If you're still using Next.js 13 with next-safe-action v4, you need to enable `serverActions` flag under the `experimental` object in next.config.js file. Find out more [here](/docs/migration/v4-to-v5).
:::

### 1. Instantiate a new client

 You can create a new client with the following code:

```typescript title="src/lib/safe-action.ts"
import { createSafeActionClient } from "next-safe-action";

export const action = createSafeActionClient();
```

This is a basic client, without any options. If you want to explore the full set of options, check out the [safe action client](/docs/safe-action-client) section.

### 2. Define a new action

This is how a safe action is created. Providing a validation input schema to the function, we're sure that data that comes in is type safe and validated.
The second argument of this function is an async function that receives the parsed input, and defines what happens on the server when the action is called from client. In short, this is your server code. It never runs on the client:

```typescript title="src/app/login-action.ts"
"use server"; // don't forget to add this!

import { z } from "zod";
import { action } from "@/lib/safe-action";

// This schema is used to validate input from client.
const schema = z.object({
  username: z.string().min(3).max(10),
  password: z.string().min(8).max(100),
});

export const loginUser = action(schema, async ({ username, password }) => {
  if (username === "johndoe" && password === "123456") {
    return {
      success: "Successfully logged in",
    };
  } 
    
  return { failure: "Incorrect credentials" };
});
```

`action` returns a new function that can be called from the client.

### 3. Import and execute the action

In this example, we're **directly** calling the Server Actions from a Client Component. The action is passed as a prop to the component, and we can infer its type by simply using `typeof`: 

```tsx title="src/app/login.tsx"
"use client"; // this is a Client Component

import { loginUser } from "./login-action";

export default function Login() {
  return (
    <button
      onClick={async () => {
        // Typesafe action called from client.
        const res = await loginUser({ username: "johndoe", password: "123456" });

        // Result keys.
        const { data, validationError, serverError } = res;
      }}>
      Log in
    </button>
  );
}
```

You also can execute Server Actions with hooks, which are a more powerful way to handle mutations. For more information about these, check out the [`useAction`](/docs/usage-from-client/hooks/useaction) and [`useOptimisticAction`](/docs/usage-from-client/hooks/useoptimisticaction) hooks sections.