---
sidebar_position: 4
description: Learn how to customize validation errors format returned to the client.
---

# Customize validation errors format

next-safe-action, by default, emulates Zod's [`format`](https://zod.dev/ERROR_HANDLING?id=formatting-errors) method for building both validation and bind args validation errors and return them to the client.

This can be customized both at the safe action client level and at the action level by:
- using [`defaultValidationErrorsShape`](/docs/safe-action-client/initialization-options#defaultvalidationerrorsshape) optional property in `createSafeActionClient`;
- using `handleValidationErrorsShape` and `handleBindArgsValidationErrorsShape` optional functions in [`schema`](/docs/safe-action-client/instance-methods#schema) and [`bindArgsSchemas`](/docs/safe-action-client/instance-methods#bindargsschemas) methods.

The second way overrides the shape set at the instance level, per action. More information below.

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
    handleValidationErrorsShape: (ve) => flattenValidationErrors(ve).fieldErrors,
  })
  .bindArgs(bindArgsSchemas, {
    // Here we use the `flattenBindArgsValidatonErrors` function to customize the returned bind args
    // validation errors object array to the client.
    handleBindArgsValidationErrors: (ve) => flattenBindArgsValidationErrors(ve),
  })
  .action(async ({ parsedInput: { username, password } }) => {
    // Your code here...
  });
```

### `flattenValidationErrors` and `flattenBindArgsValidationErrors` utility functions

Exported `flattenValidationErrors` and `flattenBindArgsValidationErrors` utility functions emulates Zod's [`flatten`](https://zod.dev/ERROR_HANDLING?id=flattening-errors) method for building validation errors and return them to the client. Be aware that they discard errors for nested fields in objects, but when dealing with simple one-level schemas, it's sometimes better to use the flattened format instead of the formatted one.

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

`flattenBindArgsValidationErrors` works the same way, but with bind args (in [`bindArgsSchemas`](/docs/safe-action-client/instance-methods#bindargsschemas) method), to build the validation errors array.

### `formatValidationErrors` and `formatBindArgsValidationErrors` utility functions

These functions emulate Zod's [`format`](https://zod.dev/ERROR_HANDLING?id=formatting-errors) method for building validation and bind args validation errors and return them to the client. You can use them, for instance, if you set the [`defaultValidationErrorsShape`](/docs/safe-action-client/initialization-options#defaultvalidationerrorsshape) to `flattened` in `createSafeActionClient` and need the formatted shape for a specific action.