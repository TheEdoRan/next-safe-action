---
sidebar_position: 4
description: Set custom validation errors in schema or in action's server code function.
---

# Custom validation errors

When input data fails schema validation, a `validationErrors` object is returned to the client. This object contains all the fields that failed validation, and their corresponding error messages.

It's often useful to also define custom logic to set additional validation errors by ourselves, for example when a user is signing up and password/confirm password fields don't match, and/or when the email is already in use. 

Let's see how to implement this specific case in the optimal way, using both schema refinements and errors set in action's server code function, thanks to `returnValidationErrors`.

## Schema refinements

First of all, we must check if the password and confirm password fields match. Using Zod in this example as our validation library, we can utilize `.refine` or `.superRefine` at the schema level to do that:

```typescript
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
}).refine(({ password, confirmPassword }) => password === confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});
```

If the two fields don't match, a custom validation error will be set for the `confirmPassword` field. This is the perfect place to make this check, because verifying that two fields are the same should be a schema job.

## `returnValidationErrors`

When registering a new user, we also need to check if the email is already stored in the database, and if so, inform the user that that address is taken by someone else. The best place to make this check is inside the action's server code function. If we find out that the email is already taken by another user, we can return a custom validation error to the client using `returnValidationErrors`:

```typescript
import { returnValidationErrors } from "next-safe-action";
import { action } from "@/lib/safe-action";

// Here we're using the same schema declared above.
const signupAction = action(schema, async ({email}) => {
  // Assume this is a database call.
  if (!isEmailAvailable(email)) {
    returnValidationErrors(schema, {
      email: {
        _errors: ["Email already registered"],
      },
    });
  }

  ...
});
```

Note that:
- You're required to pass a schema as the first argument of `returnValidationErrors`. This is used to infer the type of the validation errors to set via the second argument.
- Errors set using `returnValidationErrors` will not be merged with the schema ones. If schema validation fails, the execution stops before reaching action's server code function. Otherwise, the action's backend code would receive invalid parsed input. 
- `returnValidationErrors` returns `never`. This means that internally it throws an error that gets caught and processed by next-safe-action, so code declared below the `returnValidationErrors` invocation will not be executed.
- Since it returns `never`, you don't need to use `return` before this function call, and you can call it only once per execution path (it works the same way as Next.js `redirect` and `notFound` functions).