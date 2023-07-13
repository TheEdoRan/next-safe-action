# [next-safe-action](https://github.com/TheEdoRan/next-safe-action)

> `next-safe-action` is a library that takes full advantage of the latest and greatest Next.js, React and TypeScript features, using Zod, to let you define typesafe actions on the server and call them from Client Components. 

This is the new documentation, for version 3 of the library. If you want to check out the old documentation, [you can find it here](README_v2.md).

## Features
- ✅ Pretty simple
- ✅ End to end type safety
- ✅ Context based clients
- ✅ Input validation
- ✅ Direct or hook usage from client  
- ✅ Optimistic updates


## Requirements

Next.js >= 13.4.2 and >= TypeScript 5.0.

## Installation

```sh
npm i next-safe-action zod
```

## Code example ⬇️

### Check out [this Next.js demo](../example-app) to see a basic implementation of this library and to experiment a bit with it.

---

## Project configuration

In `next.config.js` (since Next.js 13.4.0):

```ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true, // add this
  },
};

module.exports = nextConfig;
```

Then, you need to create the safe action client:

```typescript
// src/lib/safe-action.ts

import { createSafeActionClient } from "next-safe-action";

export const action = createSafeActionClient();
```

Now create a file for an action:

```typescript
// src/app/login-action.ts

"use server"; // don't forget to add this

import { z } from "zod";
import { action } from "@/lib/safe-action";

// This is used to validate input from client.
const input = z.object({
  username: z.string().min(3).max(10),
  password: z.string().min(8).max(100),
});

// This is how a safe action is created.
// Since we provided a Zod input validator to the function, we're sure
// that data that comes in is type safe and validated.
// The second argument of this function is an async function that receives
// parsed input, and defines what happens on the server when the action is
// called from the client.
// In short, this is your backend code. It never runs on the client.
export const loginUser = action(input, async ({ username, password }) => {
    if (username === "johndoe") {
      return {
        failure: {
          reason: "user_suspended",
        },
      };
    }

    if (username === "user" && password === "password") {
      return {
        success: true,
      };
    }

    return {
      failure: {
        reason: "incorrect_credentials",
      },
    };
  }
);
```

`action` returns a new function (in this case `loginUser`). At this time, to make it actually work, we must pass the action to a Client Component as a prop, otherwise calling actions from hooks wouldn't work properly.

```tsx
// src/app/page.tsx

import Login from "./login";
import { loginUser } from "./login-action";

export default function Home() {
  return (
    {/* here we pass the safe action to the Client Component */}
    <Login loginUser={loginUser} />
  );
}
```

---

## Usage from components

> **Note**
> If you use [`redirect()`](https://nextjs.org/docs/app/api-reference/functions/redirect) and [`notFound()`](https://nextjs.org/docs/app/api-reference/functions/not-found) functions in the Server Action's backend code, you must use the `useAction` hook too. Other ways are not currently supported by Next.js. With `redirect()`, you also get a `UND_ERR_REQ_CONTENT_LENGTH_MISMATCH` error in the server console, just ignore it for now, since the action is performed anyway.

There are two ways to call safe actions from the client:

### 1. The direct way

```tsx
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
        const res = await loginUser({ username: "user", password: "password" });

        // Res keys.
        const { data, validationError, serverError } = res;
      }}>
      Log in
    </button>
  );
}
```

On the client you get back a typesafe response object, with three optional keys:

- `data`: if action runs without issues, you get what you returned in the server action body.

- `validationError`: if an invalid input object (parsed by Zod via input validator) is passed from the client when calling the action, invalid fields will populate this key, in the form of:

```json
{
  "validationError": {
    "fieldName": ["issue"],
  }
}
```

- `serverError`: if an unexpected error occurs in the server action body, it will be caught, and the client will only get back a `serverError` response. By default, the server error will be logged via `console.error`, but [this is configurable](#custom-server-error-logging).

### 2. The hook way

Another way to mutate data from client is by using the `useAction` hook. This is useful when you need global access to the action state in the Client Component.

`useAction` uses React's `useTransition` hook behind the scenes to manage the mutation.

Here's how it works:

```tsx
"use client"; // this is a Client Component

import { useAction } from "next-safe-action/hook";
import { loginUser } from "./login-action";

type Props = {
  loginUser: typeof loginUser;
};

export default function Login({ loginUser }: Props) {
  // Safe action (`loginUser`) and optional `onSuccess` and `onError` callbacks
  // passed to `useAction` hook.
  const {
    execute,
    res,
    isExecuting,
    hasExecuted,
    hasSucceded,
    hasErrored,
    reset,
  } = useAction(loginUser, {
      onSuccess: (data, reset) => {
        // Data from server action.
        const { failure, success } = data;

        // Reset response object.
        reset();
      },
      onError: (error, reset) => {
        // One of these errors.
        const { fetchError, serverError, validationError } = error;

        // Reset response object.
        reset();
      },
    }
  );

  return (
    <>
      <button
        onClick={() => {
          // Typesafe action called from client.
          execute({ username: "user", password: "password" });
        }}>
        Log in
      </button>
      <button
        onClick={() => {
          // Reset response object programmatically.
          reset();
        }}>
        Reset
      </button>
      <p>Is executing: {JSON.stringify(isExecuting)}</p>
      <p>Res: {JSON.stringify(res)}</p>
    </>
  );
}
```

The `useAction` has one required argument (the action) and one optional argument (an object with `onSuccess` and `onError` callbacks).

`onSuccess(data, reset)` and `onError(error, reset)` are executed, respectively, when the action executes successfully or fails. You can reset the response object inside these callbacks with `reset()` (second argument of the callback).

It returns an object with seven keys:

- `execute`: a caller for the safe action you provided as argument to the hook. Here you pass your typesafe `input`, the same way you do when using safe action the non-hooky way.
- `res`: when `execute` finished mutating data, the response object. It has the same three optional keys as the one above (`data`, `validationError`, `serverError`), plus one: `fetchError`. This additional optional key is populated when communication with the server fails for some reason.
- Boolean action status keys: `isExecuting`, `hasExecuted`, `hasSucceded`, `hasErrored`, pretty self-explanatory.
- `reset` function, to programatically reset the response object.

---

#### Optimistic update ✨ (experimental)

If you need optimistic UI in your Client Component, the lib also exports a hook called `useOptimisticAction`, that under the hood uses React's `experimental_useOptimistic` hook.

> **Warning**
> This feature is experimental, use it at your own risk.

Here's how it works. First, define your server action as usual:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { action } from "@/lib/safe-action";
import { incrementLikes } from "./db";

const input = z.object({
  incrementBy: z.number(),
});

export const addLikes = action(input, async ({ incrementBy }) => {
    // Add delay to simulate db call.
    await new Promise((res) => setTimeout(res, 2000));

    const likesCount = incrementLikes(incrementBy);

    // This Next.js function revalidates the provided path.
    // More info here: https://nextjs.org/docs/app/api-reference/functions/revalidatePath
    revalidatePath("/optimistic-hook");

    return {
      likesCount,
    };
  }
);
```

Then, you need to pass the initial fetched data as prop (in this case `likesCount`) from Server Component to Client Component, and use the hook in it.

```tsx
"use client"; // this is a Client Component

import { useOptimisticAction } from "next-safe-action/hook";
import { addLikes } from "./addlikes-action";

type Props = {
  likesCount: number; // this is fetched initially from server
  addLikes: typeof addLikes;
};

export default function AddLikes({ likesCount, addLikes }: Props) {
  // Safe action (`addLikes`), initial data, and optional
  // `onSuccess` and `onError` callbacks passed to `useOptimisticAction` hook.
  const {
    execute,
    isExecuting,
    res,
    hasExecuted,
    hasSucceded,
    hasErrored,
    reset,
    optimisticData,
  } = useOptimisticAction(
    addLikes,
    { likesCount }, // [1]
    {
      onSuccess: (data, reset) => {},
      onError: (error, reset) => {},
    }
  );

  return (
    <>
      <button
        onClick={() => {
          const randomIncrement = Math.round(Math.random() * 100);

          // Action call. Here we pass action input and expected (optimistic) data.
          execute(
            { incrementBy: randomIncrement },
            { likesCount: likesCount + randomIncrement }
          );
        }}>
        Add likes
      </button>
      <p>Optimistic data: {JSON.stringify(optimisticData)}</p> {/* [2] */}
      <p>Is executing: {JSON.stringify(isExecuting)}</p>
      <p>Res: {JSON.stringify(res)}</p>
    </>
  );
}
```

As you can see, `useOptimisticAction` has the same required and optional callbacks arguments as `useAction`, plus one: it requires an initializer for the optimistic data [1].

It returns the same seven keys as the regular `useAction` hook, plus one additional key [2]: `optimisticData` has the same type of the action's return object. This object will update immediately when you `execute` the action. Real data will come back once action has finished executing.

---

## Define a context object

A key feature of this library is the ability to define a context builder function when initializing a new action client. This object will then be passed as the second argument of the server action function.


To build your context, first, when creating the safe action client, you have to provide an async function called `buildContext` as an option. You can return any object you want from here, and safely throw an error in this function's body. It will be caught, and the client will receive a `serverError` response.

```typescript
// src/lib/safe-action.ts

import { createSafeActionClient } from "next-safe-action";

// This is the base safe action client.
export const action = createSafeActionClient();

// This is a safe action client with an auth context.
export const authAction = createSafeActionClient({
  // Here you can use functions such as `cookies()` or `headers()`
  // from next/headers, or utilities like `getServerSession()` from NextAuth here.
  buildContext: async () => {
    const session = true;

    if (!session) {
      throw new Error("user is not authenticated!");
    }

    return {
      userId: "coolest_user_id",
    };
  },
});
```

Then, you can use the previously defined client and access the context object:

```typescript
"use server"; // don't forget to add this

import { z } from "zod";
import { authAction } from "@/lib/safe-action";

...

// [1]: Here you have access to the context object, in this case it's just
// `{ userId }`, which comes from the return type of the `buildContext` function
// declared in the previous step.
export const editUser = authAction(input, async (parsedInput, { userId /* [1] */ }) => {
  console.log(userId); // will output: "coolest_user_id",
  ...
  }
);
```

## Custom server error logging

As you just saw, you can provide a `buildContext` function to `createSafeActionClient` function.

You can also provide a custom logger function for server errors. By default, they'll be logged via `console.error` (on the server, obviously), but this is configurable:

```typescript
// src/lib/safe-action.ts

import { createSafeActionClient } from "next-safe-action";

export const action = createSafeActionClient({
  // You can also provide an empty function here (if you don't want server error
  // logging), or a Promise. Return type is `void`.
  serverErrorLogFunction: (e) => {
    console.error("CUSTOM ERROR LOG FUNCTION:", e);
  },
});
```
## Credits

- [Zod](https://github.com/colinhacks/zod) - without Zod, this library wouldn't exist.

## License

This project is licensed under the [MIT License](LICENSE).
