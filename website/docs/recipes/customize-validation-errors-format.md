---
sidebar_position: 4
description: Learn how to customize validation errors format returned to the client.
---

# Customize validation errors format

next-safe-action, by default, emulates Zod's [`format`](https://zod.dev/ERROR_HANDLING?id=formatting-errors) method for building both validation and bind args validation errors and return them to the client.

This can be customized by using `formatValidationErrors` and `formatBindArgsValidationErrors` optional functions in [`schema`](/docs/safe-action-client/instance-methods#schema) and [`bindArgsSchemas`](/docs/safe-action-client/instance-methods#bindargsschemas) methods.

For example, if you want to flatten the validation errors (emulation of Zod's [`flatten`](https://zod.dev/ERROR_HANDLING?id=flattening-errors) method), you can (but not required to) use the `flattenValidationErrors` utility function exported from the library, combining it with `formatValidationErrors` inside `schema` method:

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
		formatValidationErrors: (ve) => flattenValidationErrors(ve).fieldErrors,
	})
	.bindArgs(bindArgsSchemas, {
		// Here we use the `flattenBindArgsValidatonErrors` function to customize the returned bind args
		// validation errors object array to the client.
		formatBindArgsValidationErrors: (ve) => flattenBindArgsValidationErrors(ve),
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

When passed to `formatValidationErrors`, the function will return a flattened version of it:

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

### Flatten function for `schema` method

next-safe-action, by default, uses the formatted validation errors structure, so errors for nested fields don't get discarded.

If you need or want to flatten validation errors often, though, you can define an utility function like this one (assuming you're using Zod, but you can adapt it to your needs):

```typescript title="src/lib/safe-action.ts"
function fve<const S extends z.ZodTypeAny>(
	schema: S
): [
	S,
	{
		formatValidationErrors: FormatValidationErrorsFn<
			S,
			FlattenedValidationErrors<ValidationErrors<S>>
		>;
	},
] {
	return [
		schema,
		{
			formatValidationErrors: (ve: ValidationErrors<S>) =>
				flattenValidationErrors(ve),
		},
	];
}
```

That can then be used in [`schema`](/docs/safe-action-client/instance-methods#schema) method:

```typescript src="src/app/login-action.ts"
import { actionClient, fve } from "@/lib/safe-action";
import { z } from "zod";

const schema = z.object({
	username: z.string().min(3).max(30),
});

// Spread `fve` utility function in the `schema` method. Type safety is preserved.
//                                     \\\\\\\\\\\\\\
const loginUser = actionClient
	.schema(...fve(schema))
	.action(async ({ parsedInput: { username } }) => {
		return {
			greeting: `Welcome back, ${username}!`,
		};
	});
```
