# [next-safe-mutation](https://github.com/TheEdoRan/next-safe-mutation)

> `next-safe-mutation` is a library that uses the latest and greatest Next.js, React and TypeScript features to generate typesafe mutations in Server and Client Components. 

### Note: server/client mutations are implemented but undocumented at this time in Next.js. They are available since `13.3.0` release.

## Requirements

Next.js >= 13.3.0 and >= TypeScript 5.0.

## Installation

```sh
npm i next-safe-mutation zod
```

## Project configuration

### Code blocks below are taken from [this example repository](https://github.com/TheEdoRan/next-safe-mutation-example). Check it out to see a basic implementation of this library and to experiment a bit with it.

---

First of all, you need to create the safe mutation client:

```typescript
// src/lib/safe-mutation.ts

import { createSafeMutationClient } from "next-safe-mutation";

const { safeMutation } = createSafeMutationClient();

export { safeMutation };
```

Then, create a file for a mutation:

```typescript
// src/app/login-mutation.ts

"use server"; // don't forget to add this directive

import { createMutationOutputValidator } from "next-safe-mutation";
import { z } from "zod";
import { safeMutation } from "~/lib/safe-mutation";

// This is used to validate input from client.
const inputValidator = z.object({
  username: z.string().min(3).max(10),
  password: z.string().min(8).max(100),
});

// This is used to create an ouput validator.
// `successData` and `clientErrorData` are required keys.
const outputValidator = createMutationOutputValidator({
  successData: z.object({ ok: z.literal(true) }),
  clientErrorData: z.object({
    reason: z.enum(["incorrect_credentials", "user_suspended"]),
  }),
});

// This is how a safe mutation is created.
// Since we provided Zod input and output validators to the function, we're sure that data that comes in and out of this is type safe and validated.
// The second argument of this function is an async function that receives parsed input, and defines what happens on the server when the mutation is called from the client. In short, this is your backend code. It never runs on the client.
export const loginUser = safeMutation(
  { inputValidator, outputValidator },
  async ({ username, password }) => { // typesafe input
    if (username === "johndoe") {
      return {
        type: "clientError",
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
      type: "clientError",
      data: {
        reason: "incorrect_credentials",
      },
    };
  }
);
```

---

The `safeMutation` function returns a new function (in this case `loginUser`), that is used in Client Components. Here's how it works.


First, create a Client Component, and receive the mutation function as a prop:

```tsx
// src/app/login-form.tsx

"use client"; // this is a client component

import { useState } from "react";
import { loginUser } from "./login-mutation";

type Props = {
  loginUser: typeof loginUser; // you just need `typeof` here to get typesafety!
};

const LoginForm = ({ loginUser }: Props) => {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const input = Object.fromEntries(formData) as {
          username: string;
          password: string;
        };
        const res = await loginUser(input); // this is the typesafe mutation called from client!
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

Then, pass the typesafe mutation from a Server Component as prop:

```tsx
// src/app/page.tsx

import LoginForm from "./login-form";
import { loginUser } from "./login-mutation";

const Home = () => {
  return (
    <LoginForm loginUser={loginUser} />
  );
}

export default Home;
```

As you can see from the image, on the client you get back a typesafe response object, with four optional keys:

![Typesafe response](https://raw.githubusercontent.com/TheEdoRan/next-safe-mutation/main/assets/typesafe-client-response.png)

Here's an explanation:

- `success` or `clientError`: if mutation runs without issues, you get what you returned in the server mutation body, with a type of output validator's `successData` or `clientErrorData` key (see second code block).

- `inputValidationErrorFields`: if an invalid input object (parsed by Zod via `inputValidator`) is passed from the client when calling the mutation, invalid fields will populate this key, in the form of:

```json
{
  "inputValidationErrorFields": {
    "fieldName": ["issue"],
  }
}
```

- `serverError`: if an unexpected error occurs in the server mutation body, it will be caught, and the client will only get back a `{ serverError: true }` response. By default, the server error will be logged via `console.error`, but this is configurable.

## Authenticated mutation

The library also supports creating protected mutations, that will return a `serverError` back if user is not authenticated. You need to make some changes to the above code to be able to use them.

First, you **must** create a declaration file (where you want in your project, but make sure that TypeScript is picking it up correctly), and define your custom `AuthData` interface into it:

```typescript
// next-safe-mutation.d.ts

import "next-safe-mutation";

declare module "next-safe-mutation" {
  interface AuthData {
    userId: string;
  }
}
```


Then, when creating the safe mutation client, you **must** provide an `async function` called `getAuthData` as an option. The return type of this function depends on the interface you just declared. For example, this function must return an object with an `userId` key of type `string`. If you find out that the user is not authenticated, you can safely throw an error here. It will be caught, and a response with `{ serverError: true }` is returned to the client.

```typescript
// src/app/lib/safe-mutation.ts

const { safeMutation } = createSafeMutationClient({
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
```

Then, you can provide a `withAuth: true` option to the safe mutation you're creating:

```typescript
// src/app/withauth/edituser-mutation.ts

// [1] For protected mutations, you need to provide `withAuth: true` here.
// [2] Then, you'll have access to the auth object, in this case it's just `{ userId }`, which comes from the `AuthData` interface declared in `next-safe-mutation.d.ts` file.
export const editUser = safeMutation(
  { inputValidator, outputValidator, withAuth: true }, // [1]
  async (parsedInput, { userId }) => {  // [2]
    console.log(userId); // will output: "coolest_user_id",
    ...
  }
);
```

If you set `withAuth` to `true` in the safe mutation you're creating, but you forgot to define a `getAuthData` function when creating the client (above step), an error will be thrown when calling the mutation from client, that results in a `{ serverError: true }` response for the client.

## `createSafeMutationClient` options

As you just saw, you can provide a `getAuthData` function to `createSafeMutationClient` function.

You can also provide a custom logger function for server errors. By default, they'll be logged via `console.error` (on the server, obviously), but this is configurable:

```typescript
// src/app/lib/safe-mutation.ts

import { createSafeMutationClient } from "next-safe-mutation";

const { safeMutation } = createSafeMutationClient({
  // You can also provide an empty function here (if you don't want server error logging), or a Promise. Return type is `void`.
  serverErrorLogFunction: (e) => {
    console.error("CUSTOM ERROR LOG FUNCTION:", e);
  },
});

export { safeMutation };
```

## TODO
- [ ] Testing

## License

This project is licensed under the [MIT License](https://github.com/TheEdoRan/next-safe-mutation/blob/main/LICENSE).