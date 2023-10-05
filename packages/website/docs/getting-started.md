---
sidebar_position: 2
description: Getting started with next-safe-action version 4.
---

# Getting started

:::note
This is the documentation for the current version of the library (4.x.x). If you are looking for version 3.x.x or 2.x.x docs, please check out [README_v3](https://github.com/TheEdoRan/next-safe-action/blob/main/packages/next-safe-action/README_v3.md) or [README_v2](https://github.com/TheEdoRan/next-safe-action/blob/main/packages/next-safe-action/README_v2.md) from the GitHub repository.
:::

:::info Requirements
- Next.js >= 13.4.2
- TypeScript >= 5.0.0
- Zod >= 3.0.0
:::

**next-safe-action** provides a typesafe Server Actions implementation for Next.js's 13 App Router, using Zod.

## Installation

```bash npm2yarn
npm i next-safe-action zod
```

## Usage

:::note
Turning on Server Actions in Next.js configuration file will switch the used React version to experimental.
:::

### 1. Enable server actions in Next.js

To be able to use server actions, you need to enable them in your Next.js configuration (next.config.js file in project's root directory):

```javascript title="next.config.js"
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true, // add this
  },
};

module.exports = nextConfig;
```

### 2. Instantiate a new client

 You can create a new client with the following code:

```typescript title="src/lib/safe-action.ts"
import { createSafeActionClient } from "next-safe-action";

export const action = createSafeActionClient();
```

This is a basic client, without any options. If you want to explore the full set of options, check out the [safe action client](/docs/safe-action-client) section.

### 3. Define a new action

This is how a safe action is created. Providing a Zod input schema to the function, we're sure that data that comes in is type safe and validated.
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

### 4. Pass the action from a Server Component to a Client Component

To avoid getting unwanted bugs when revalidating data on the server, it is _strongly_ recommended to pass the action from a Server Component to a Client Component, like this:

```tsx title="src/app/page.tsx"
import Login from "./login";
import { loginUser } from "./login-action";

export default function Home() {
  return (
    <Login loginUser={loginUser} />
  );
}
```

### 5. Execute the action

In this example, we're **directly** calling the Server Actions from a Client Component. The action is passed as a prop to the component, and we can infer its type by simply using `typeof`: 

```tsx title="src/app/login.tsx"
"use client"; // this is a Client Component

import type { loginUser } from "./login-action";

type Props = {
  loginUser: typeof loginUser; // infer typings with `typeof`
}

export default function Login({ loginUser }: Props) {
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