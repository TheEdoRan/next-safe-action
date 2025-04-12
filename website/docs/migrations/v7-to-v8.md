---
sidebar_position: 4
description: Learn how to migrate from next-safe-action version 7 to version 8.
sidebar_label: v7 to v8
---

# Migration from v7 to v8

Version 8 introduces significant changes to the validation system, improves type safety for metadata, and fixes next/navigation behaviors.

Legend:
- ⚠️ Breaking change
- 🆕 New feature
- ✨ Improvement
- 🔄 Refactor

## What's new?

### ⚠️🆕 Standard Schema support

The biggest change in v8 is the switch to [Standard Schema](https://github.com/standard-schema/standard-schema) for validation. This removes the need for internal custom validation adapters and simplifies the API. You can find the supported Standard Schema libraries [here](https://github.com/standard-schema/standard-schema?tab=readme-ov-file#what-schema-libraries-implement-the-spec).

```typescript title="v7 - using Valibot"
import { createSafeActionClient } from "next-safe-action";
import { valibotAdapter } from "next-safe-action/adapters/valibot";

export const actionClient = createSafeActionClient({
  validationAdapter: valibotAdapter(),
});
```

```typescript title="v8"
import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient();
```

### ⚠️🆕 Navigation status and callbacks

The behavior when using functions from `next/navigation` was very unclear and confusing in v7 and below, since all functions from `next/navigation` produced a `hasSucceeded` status and triggered `onSuccess` callbacks.

This behavior has been changed in v8. Now, when you're using functions imported from `next/navigation` in an action:
- the hooks `status` value will be `"hasNavigated"` instead of `"hasSucceeded"`;
- a new `onNavigation()` callback will be triggered, both for actions and hooks, instead of `onSuccess()`. This callback receives a `navigationKind` value, that indicates the type of navigation that occurred;
- the `success` property of the middleware result will now be `false`, instead of `true`, if a navigation function was called in a middleware function or in the action's server code function.

```typescript
import { useAction } from "next-safe-action/hooks";
import { redirect } from "next/navigation";

// In the action definition
const action = actionClient.action(
  async () => {
    redirect("/");
  },
  {
    onNavigation: async ({ navigationKind }) => {
      // Do something with the navigation...
    },
  }
);

// In the component
const { execute, status } = useAction(action, {
  onNavigation: ({ navigationKind }) => {
    // Do something with the navigation...
  },
});
```

### ⚠️✨ Stricter bound args validation

When using bound arguments with invalid data, errors are now thrown instead of being returned as part of the result object. This is because bound arguments should not be passed to the action from the user, instead they should be received from the server. So, this change aligns the behavior of bound arguments with the behavior of metadata and output validation, and prevents potential leakage of sensitive data on the client side.

```typescript title="v7"
const boundAction = action.bind(null, invalidBindArg);

// No error thrown on the server, `bindArgsValidationErrors`
// gets returned to the client in the result object.
const { bindArgsValidationErrors } = await boundAction(input);
```

```typescript title="v8"
const boundAction = action.bind(null, invalidBindArg);

// No bound arg errors are returned to the client, instead
// an `ActionBindArgsValidationError` is thrown on the server.
const result = await boundAction(input);
```

### ⚠️ Removal of deprecated `executeOnMount` hook option

The deprecated `executeOnMount` hook functionality has been removed in v8. Server Actions should be used only for mutations, so it doesn't make sense to execute them on mount. Or at least, it shouldn't be a common case and, above all, a library job. If you still need to do it, just use `useEffect()` to trigger the execution, however you want.

### ✨ Type-checked metadata

This is a big improvement in type safety over v7. Metadata is now statically type-checked when passed to actions. So, now if you forget to pass the expected metadata shape, as defined by the `defineMetadataSchema` init option, you will get a type error immediately:

<video controls autoPlay loop muted width="320" height="240">
  <source src="/vid/metadata-v8.mp4"/>
</video>

### ✨ Custom thrown validation error messages

The `throwValidationErrors` option now accepts both a boolean (just like in v7) and an object with a `overrideErrorMessage()` function, that allows you to customize the thrown `Error` message on the client side.

```typescript
import { throwValidationErrors, overrideErrorMessage } from "next-safe-action";

const action = actionClient
  .inputSchema(z.object({ name: z.string() }))
  .action(
  async () => {
    return {
      success: true,
    };
  },
  {
    throwValidationErrors: {
      // If input validation fails, here we can customize the error message
      // returned to the client.
      overrideErrorMessage: async (validationErrors) => {
        return validationErrors.name?._errors?.join(" ") ?? "";
      },
    },
  }
);
```

### 🔄 Safe action result always defined

The action result object is now always defined. This allows you to destructure it without the need to check if it's defined or not first:

```typescript title="v7"
// Cannot access data directly, we need to check if
// result is defined first.
const result = await action(input);

if (result?.data) {
  // Do something with the data...
}
```

```typescript title="v8"
// Now we can destructure the result object and
// access data directly.
const { data } = await action(input);
```

### 🔄 `schema` method renamed to `inputSchema`

The library, since version 7.8.0, supports both input and output validation, respectively using the `schema()` and `outputSchema()` methods. In v8, the `schema()` method has been renamed to `inputSchema()` to better reflect its purpose, and avoid potential confusion.

The `schema()` method is deprecated and will be removed in a future version, but it's still available for backward compatibility. It's now just an alias for `inputSchema()`:

```typescript title="v7"
actionClient.schema(/* ... */)
```

```typescript title="v8"
actionClient.inputSchema(/* ... */)
```

:::info UPDATE EXISTING ACTIONS
To update your actions, you can just use the search and replace feature of your editor to replace all occurrences of `.schema()` with `.inputSchema()`.
:::


### 🔄 Deprecation of `useStateAction` hook

The `useStateAction()` hook has been deprecated. It's always been kind of a hack to begin with, and it doesn't support progressive enhancement, since it tries to do what the `useAction()` and `useOptimisticAction()` hooks do, with JS functionality.

So, from now one, the recommended way to use stateful actions is to do it with the React's built in `useActionState()` hook, as explained in [this section](/docs/recipes/form-actions#stateful-form-actions) of the documentation.

## Requirements

next-safe-action version 8 requires Next.js 14 and React 18.2.0 or later to work.

## What about v7?

You can find the v7 documentation [here](https://v7.next-safe-action.dev).