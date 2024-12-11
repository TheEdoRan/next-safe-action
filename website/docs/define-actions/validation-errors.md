---
sidebar_position: 5
description: Learn how to customize or manually creating validation errors.
---

# Validation errors

## Customize validation errors format

next-safe-action, by default, emulates Zod's [`format`](https://zod.dev/ERROR_HANDLING?id=formatting-errors) method for building both validation and bind args validation errors and return them to the client.

This can be customized both at the safe action client level and at the action level by:
- using [`defaultValidationErrorsShape`](/docs/define-actions/create-the-client#defaultvalidationerrorsshape) optional property in `createSafeActionClient`;
- using `handleValidationErrorsShape` and `handleBindArgsValidationErrorsShape` optional async functions in [`schema`](/docs/define-actions/instance-methods#schema) and [`bindArgsSchemas`](/docs/define-actions/instance-methods#bindargsschemas) methods.

The second way overrides the shape set at the instance level, per action.

For example, if you want to flatten the validation errors (emulation of Zod's [`flatten`](https://zod.dev/ERROR_HANDLING?id=flattening-errors) method), you can (but not required to) use the `flattenValidationErrors` utility function exported from the library, combining it with `handleValidationErrorsShape` inside `schema` method:

```typescript src="src/app/login-action.ts"
"use server";

import { actionClient } from "@/lib/safe-action";
import {
  flattenValidationErrors,
  flattenBindArgsValidationErrors,
} from "next-safe-action";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(3).max(10),
  password: z.string().min(8).max(100),
});

const bindArgsSchemas = [z.string().uuid()] as const;

export const loginUser = actionClient
  .schema(schema, {
    // Here we use the `flattenValidationErrors` function to customize the returned validation errors
    // object to the client.
    // highlight-next-line
    handleValidationErrorsShape: async (ve, utils) => flattenValidationErrors(ve).fieldErrors,
  })
  .bindArgsSchemas(bindArgsSchemas, {
    // Here we use the `flattenBindArgsValidatonErrors` function to customize the returned bind args
    // validation errors object array to the client.
    // highlight-next-line
    handleBindArgsValidationErrorsShape: async (ve, utils) => flattenBindArgsValidationErrors(ve),
  })
  .action(async ({ parsedInput: { username, password } }) => {
    // Your code here...
  });
```

The second argument of both `handleValidationErrorsShape` and `handleBindArgsValidationErrorsShape` functions is an `utils` object that contains info about the current action execution (`clientInput`, `bindArgsClientInputs`, `metadata` and `ctx` properties). It's passed to the functions to allow granular and dynamic customization of the validation errors shape.

:::note
If you chain multiple `schema` methods, as explained in the [Extend previous schema](/docs/define-actions/extend-previous-schemas) page, and want to override the default validation errors shape, you **must** use `handleValidationErrorsShape` inside the last `schema` method, otherwise there would be a type mismatch in the returned action result.
:::

### `flattenValidationErrors` and `flattenBindArgsValidationErrors` utility functions

Exported `flattenValidationErrors` and `flattenBindArgsValidationErrors` utility functions emulate Zod's [`flatten`](https://zod.dev/ERROR_HANDLING?id=flattening-errors) method for building validation errors and return them to the client. Be aware that they discard errors for nested fields in objects, but when dealing with simple one-level schemas, it's sometimes better to use the flattened format instead of the formatted one.

So, for instance, a formatted (default) validation errors object like this:

```typescript
validationErrors = {
  _errors: ["A global error"],
  username: {
    _errors: ["Username format is invalid", "Username is too short"],
  },
  password: {
    _errors: ["Password must be at least 8 characters long"],
  },
};
```

When passed to `flattenValidationErrors`, the function will return a flattened version of it:

```typescript
const flattenedErrors = flattenValidationErrors(validationErrors);

// `flattenedErrors` will be:
flattenedErrors = {
  formErrors: ["A global error"],
  fieldErrors: {
    username: ["Username format is invalid", "Username is too short"],
    password: ["Password must be at least 8 characters long"],
  },
};
```

`flattenBindArgsValidationErrors` works the same way, but with bind args (in [`bindArgsSchemas`](/docs/define-actions/instance-methods#bindargsschemas) method), to build the validation errors array.

### `formatValidationErrors` and `formatBindArgsValidationErrors` utility functions

These functions emulate Zod's [`format`](https://zod.dev/ERROR_HANDLING?id=formatting-errors) method for building validation and bind args validation errors and return them to the client. You can use them, for instance, if you set the [`defaultValidationErrorsShape`](/docs/define-actions/create-the-client#defaultvalidationerrorsshape) to `flattened` in `createSafeActionClient` and need the formatted shape for a specific action.

## Create custom validation errors

When input data fails schema validation, a `validationErrors` object is returned to the client. This object contains all the fields that failed validation, and their corresponding error messages.

It's often useful to also define custom logic to set additional validation errors by ourselves, for example when a user is signing up and password/confirm password fields don't match, and/or when the email is already in use.

Let's see how to implement this specific case in the optimal way, using both schema refinements and errors set in action's server code function, thanks to `returnValidationErrors`.

### Schema refinements

First of all, we must check if the password and confirm password fields match. Using Zod in this example as our validation library, we can utilize `.refine` or `.superRefine` at the schema level to do that:

```typescript
import { z } from "zod";

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  // highlight-start
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
  // highlight-end
```

If the two fields don't match, a custom validation error will be set for the `confirmPassword` field. This is the perfect place to make this check, because verifying that two fields are the same should be a schema job.

### `returnValidationErrors`

When registering a new user, we also need to check if the email is already stored in the database, and if so, inform the user that that address is taken by someone else. The best place to make this check is inside the action's server code function. If we find out that the email is already taken by another user, we can return a custom validation error to the client using `returnValidationErrors`:

```typescript
import { returnValidationErrors } from "next-safe-action";
import { actionClient } from "@/lib/safe-action";

// Here we're using the same schema declared above.
const signupAction = actionClient
  .schema(schema)
  .action(async ({ parsedInput: { email } }) => {
    // Assume this is a database call.
    if (!isEmailAvailable(email)) {
      // highlight-start
      returnValidationErrors(schema, {
        email: {
          _errors: ["Email already registered"],
        },
      });
      // highlight-end
    }

    ...
  });
```

Note that:

- You're required to pass a schema as the first argument of `returnValidationErrors`. This is used to infer the type of the validation errors set via the second argument.
- Errors set using `returnValidationErrors` will not be merged with the schema ones. If schema validation fails, the execution stops before reaching action's server code function. Otherwise, the action's backend code would receive invalid parsed input.
- `returnValidationErrors` returns `never`. This means that internally it throws an error that gets caught and processed by next-safe-action, so code declared below the `returnValidationErrors` invocation will not be executed.
- Since it returns `never`, you don't need to use `return` before this function call, and you can call it only once per execution path (it works the same way as Next.js `redirect` and `notFound` functions).