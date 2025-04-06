---
sidebar_position: 1
description: Getting started with next-safe-action version 7.
---

# Getting started

:::info Requirements

- Next.js >= 14
- React >= 18.2.0
- TypeScript >= 5
- A validation library supported by [Standard Schema](https://github.com/standard-schema/standard-schema)
:::

**next-safe-action** provides a typesafe Server Actions implementation for Next.js App Router applications.

## Installation

```bash npm2yarn
npm i next-safe-action
```

## Usage

### 1. Instantiate a new client

You can create a new client with the following code:

```typescript title="src/lib/safe-action.ts"
import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient();
```

This is a basic client, without any options or middleware functions. If you want to explore the full set of options, check out the [create the client](/docs/define-actions/create-the-client) section.

### 2. Define a new action

This is how a safe action is created. Providing a validation input schema to the function via [`inputSchema()`](/docs/define-actions/instance-methods#inputSchema), we're sure that data that comes in is type safe and validated.
The [`action()`](/docs/define-actions/instance-methods#action--stateaction) method lets you define what happens on the server when the action is called from client, via an async function that receives the parsed input and context as arguments. In short, this is your _server code_. **It never runs on the client.

In this documentation, we'll use the Zod library to define our validation logic, but feel free to use any other library that implements the [Standard Schema](https://github.com/standard-schema/standard-schema) specification.

```typescript title="src/app/login-action.ts"
"use server"; // don't forget to add this!

import { z } from "zod";
import { returnValidationErrors } from "next-safe-action";
import { actionClient } from "@/lib/safe-action";

// This schema is used to validate input from client.
const inputSchema = z.object({
  username: z.string().min(3).max(10),
  password: z.string().min(8).max(100),
});

export const loginUser = actionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { username, password } }) => {
    if (username === "johndoe" && password === "123456") {
      return {
        success: "Successfully logged in",
      };
    }

    return returnValidationErrors(inputSchema, { _errors: ["Incorrect credentials"] });
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
        // highlight-start
        const res = await loginUser({
          username: "johndoe",
          password: "123456",
        });
        // highlight-end

        // Result keys.
        const {
          data,
          validationErrors,
          serverError,
        } = res;
      }}>
      Log in
    </button>
  );
}
```

You also can execute Server Actions with hooks, which are a more powerful way to handle mutations. For more information about these, check out the [`useAction`](/docs/execute-actions/hooks/useaction) and [`useOptimisticAction`](/docs/execute-actions/hooks/useoptimisticaction) hooks sections.