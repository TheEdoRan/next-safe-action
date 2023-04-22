# [next-safe-mutation](https://github.com/TheEdoRan/next-safe-mutation)

> `next-safe-mutation` is a library that takes full advantage of the latest and greatest Next.js, React and TypeScript features to let you define typesafe mutations on the server and call them from Client Components. 

### Note: server/client mutations are implemented but undocumented at this time in Next.js. They are available since `13.3.0` release.

## Requirements

Next.js >= 13.3.0 and >= TypeScript 5.0.

## Installation

```sh
npm i next-safe-mutation zod
```

## Project configuration

### Code blocks below are based on [this example repository](https://github.com/TheEdoRan/next-safe-mutation-example). Check it out to see a basic implementation of this library and to experiment a bit with it.

---

First of all, you need to create the safe mutation client:

```typescript
// src/lib/safe-mutation.ts

import { createSafeMutationClient } from "next-safe-mutation";

const safeMutation = createSafeMutationClient();

export { safeMutation };
```

Then, create a file for a mutation:

```typescript
// src/app/login-mutation.ts

"use server"; // don't forget to add this

import { z } from "zod";
import { safeMutation } from "~/lib/safe-mutation";

// This is used to validate input from client.
const input = z.object({
  username: z.string().min(3).max(10),
  password: z.string().min(8).max(100),
});

// This is how a safe mutation is created.
// Since we provided a Zod input validator to the function, we're sure
// that data that comes in is type safe and validated.
// The second argument of this function is an async function that receives
// parsed input, and defines what happens on the server when the mutation is
// called from the client.
// In short, this is your backend code. It never runs on the client.
export const loginUser = safeMutation({ input }, async ({ username, password }) => {
    if (username === "johndoe") {
      return {
        type: "fail",
        data: {
          reason: "user_suspended",
        },
      };
    }

    if (username === "user" && password === "password") {
      return {
        type: "success",
        data: {
          ok: true,
        },
      };
    }

    return {
      type: "fail",
      data: {
        reason: "incorrect_credentials",
      },
    };
  }
);
```

`safeMutation` returns a new function (in this case `loginUser`). We must provide the mutation to a Client Component as a prop, otherwise Server Component functions (e.g. `cookies()` or `headers()`) wouldn't work in the mutation body (defined above).

```tsx
// src/app/page.tsx

import LoginForm from "./login-form";
import { loginUser } from "./login-mutation";

export default function Home() {
  return (
    {/* here we pass the safe mutation as `login` */}
    <LoginForm login={loginUser} />
  );
}
```

---

There are two ways to call safe mutations from the client:

## 1. The direct way

```tsx
// src/app/login-form.tsx

"use client"; // this is a client component

import { useState } from "react";
import type { loginUser } from "./login-mutation";

type Props = {
  login: typeof loginUser; // infer typings with `typeof`
}

const LoginForm = ({ login }: Props) => {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const input = Object.fromEntries(formData) as {
          username: string;
          password: string;
        };
        const res = await login(input); // this is the typesafe mutation called from client!
        console.log(res);
      }}>
      <input
        type="text"
        name="username"
        id="username"
        placeholder="Username"
      />
      <input
        type="password"
        name="password"
        id="password"
        placeholder="Password"
      />
      <button type="submit">Log in</button>
    </form>
  );
};

export default LoginForm;
```

As you can see from the image, on the client you get back a typesafe response object, with four optional keys:

![Typesafe response](https://raw.githubusercontent.com/TheEdoRan/next-safe-mutation/main/assets/typesafe-client-response.png)

Here's an explanation:

- `success` or `fail`: if mutation runs without issues, you get what you returned in the server mutation body.

- `validationError`: if an invalid input object (parsed by Zod via input validator) is passed from the client when calling the mutation, invalid fields will populate this key, in the form of:

```json
{
  "validationError": {
    "fieldName": ["issue"],
  }
}
```

- `serverError`: if an unexpected error occurs in the server mutation body, it will be caught, and the client will only get back a `serverError` response. By default, the server error will be logged via `console.error`, but [this is configurable](https://github.com/TheEdoRan/next-safe-mutation#createsafemutationclient-options).

## 2. The hook way

Another way to mutate data from client is by using the `useMutation` hook. This is useful when you need global access to the mutation state in the Client Component.

Here's how it works:

```tsx
// src/app/hook/deleteuser-form.tsx

"use client"; // this is a client component

import { useMutation } from "next-safe-mutation/hook";
import type { deleteUser } from "./deleteuser-mutation";

type Props = {
  remove: typeof deleteUser;
}

const DeleteUserForm = ({ remove }: Props) => {
  // Safe mutation (`remove` which is `deleteUser`) passed to `useMutation` hook.
  const myDelete = useMutation(remove);

  return (
    <>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const input = Object.fromEntries(formData) as {
            userId: string;
          };

          // Mutation call.
          await myDelete.mutate(input);
        }}>
        <input type="text" name="userId" id="userId" placeholder="User ID" />
        <button type="submit">Delete user</button>
      </form>
      <div id="response-container">
        <pre>Is mutating: {JSON.stringify(myDelete.isMutating)}</pre>
        <div>Mutation response:</div>
        <pre className="response">
          {
            myDelete.res // if got back a response,
            ? JSON.stringify(myDelete.res, null, 1)
            : "fill in form and click on the delete user button" // if mutation never ran
          }
        </pre>
      </div>
    </>
  );
};

export default DeleteUserForm;
```

The `useMutation` hook returns an object with three keys:

- `mutate`: a caller for the safe mutation you provided as argument to the hook. Here you pass your typesafe `input`, the same way you do when using safe mutation the non-hooky way.
- `isMutating`: a `boolean` that is true while the `mutate` function is mutating data.
- `res`: when `mutate` finished mutating data, the response object. Otherwise it is `null`. It has the same four optional keys as the one above (`success`, `fail`, `validationError`, `serverError`), plus one: `fetchError`. This additional optional key is populated when communication with the server fails for some reason.

Image example:

![Hook typesafe response](https://raw.githubusercontent.com/TheEdoRan/next-safe-mutation/main/assets/hook-typesafe-client-response.png)


## Authenticated mutation

The library also supports creating protected mutations, that will return a `serverError` back if user is not authenticated. You need to make some changes to the above code in order to use them.

First, when creating the safe mutation client, you **must** provide an `async function` called `getAuthData` as an option. You can return anything you want from here. If you find out that the user is not authenticated, you can safely throw an error in this function. It will be caught, and the client will receive a `serverError` response.

```typescript
// src/lib/safe-mutation.ts

const safeMutation = createSafeMutationClient({
  getAuthData: async () => {
    const session = true;

    if (!session) {
      throw new Error("user is not authenticated!");
    }

    return {
      userId: "coolest_user_id",
    };
  },
});

export { safeMutation };
```

Then, you can provide a `withAuth: true` option to the safe mutation you're creating:

```typescript
// src/app/withauth/edituser-mutation.ts

// [1] For protected mutations, you need to provide `withAuth: true` here.
// [2] Then, you'll have access to the auth object, in this case it's just
// `{ userId }`, which comes from the return type of the `getAuthData` function
// declared in the previous step.
export const editUser = safeMutation({ input, withAuth: true }, // [1]
  async (parsedInput, { userId }) => { // [2]
    console.log(userId); // will output: "coolest_user_id",
    ...
  }
);
```

If you set `withAuth` to `true` in the safe mutation you're creating, but you forgot to define a `getAuthData` function when creating the client (above step), an error will be thrown when calling the mutation from client, that results in a `serverError` response for the client.

## `createSafeMutationClient` options

As you just saw, you can provide a `getAuthData` function to `createSafeMutationClient` function.

You can also provide a custom logger function for server errors. By default, they'll be logged via `console.error` (on the server, obviously), but this is configurable:

```typescript
// src/lib/safe-mutation.ts

import { createSafeMutationClient } from "next-safe-mutation";

const safeMutation = createSafeMutationClient({
  // You can also provide an empty function here (if you don't want server error
  // logging), or a Promise. Return type is `void`.
  serverErrorLogFunction: (e) => {
    console.error("CUSTOM ERROR LOG FUNCTION:", e);
  },
});

export { safeMutation };
```

## License

This project is licensed under the [MIT License](https://github.com/TheEdoRan/next-safe-mutation/blob/main/LICENSE).
