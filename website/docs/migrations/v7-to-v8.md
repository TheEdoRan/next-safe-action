---
sidebar_position: 4
description: Learn how to migrate from next-safe-action version 7 to version 8.
sidebar_label: v7 to v8
---

# Migration from v7 to v8

Version 8 introduces significant changes to the validation system, improves type safety for metadata, and fixes next/navigation behaviors.

## What's new?

### [BREAKING] Standard Schema support

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

### [BREAKING] Navigation status and callbacks

The behavior when using functions from `next/navigation` was very unclear and confusing in v7 and below, since all functions from `next/navigation` produced a `hasSucceeded` status and triggered `onSuccess` callbacks.

This behavior has been changed in v8. Now, when you're using functions imported from `next/navigation` in an action:
- the hooks `status` value will be `"hasNavigated"` instead of `"hasSucceeded"`;
- a new `onNavigation` callback will be triggered, both for actions and hooks, instead of `onSuccess`. This callback receives a `navigationKind` value, that indicates the type of navigation that occurred.

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

### [BREAKING] Stricter bound args validation

When using bound arguments with invalid data, errors are now thrown instead of being returned as part of the result object. This is because bound arguments should not be passed to the action from the user, instead they should be received from the server. So, this change aligns the behavior of bound arguments with the behavior of metadata, and prevents potential leakage of sensitive data on the client side.

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

### [BREAKING] Removal of deprecated `executeOnMount` hook option

The `executeOnMount` option has been removed from hooks:

```typescript
// v7
const { data } = useAction(action, {
  executeOnMount: true,
  initialInput: { name: "John" }
});

// v8 - no longer supported
// You should execute the action manually when the component mounts
const { execute, data } = useAction(action);
useEffect(() => {
  execute({ name: "John" });
}, []);
```

### Type-checked metadata

Metadata is now type-checked when passed to actions. So, now if you forget to pass the expected metadata, you will get a type error.

<video controls autoPlay loop muted width="320" height="240">
  <source src="/vid/metadata-v8.mp4"/>
</video>

### Custom thrown validation error messages

A new `overrideErrorMessage` function has been added to the `throwValidationErrors` utility, allowing you to customize error messages:

```typescript
import { throwValidationErrors, overrideErrorMessage } from "next-safe-action";

actionClient
  .inputSchema((s) => ({
    username: s.string().minLength(3)
  }))
  .action(async ({ parsedInput: { username } }) => {
    // Custom validation error with overridden message
    if (usernameExists(username)) {
      throwValidationErrors({
        username: overrideErrorMessage("This username is already taken")
      });
    }
    
    // ...
  });
```
### `schema` method renamed to `inputSchema`

The `schema` method has been renamed to `inputSchema` to better reflect its purpose:

```typescript
// v7
actionClient.schema(/* ... */)

// v8
actionClient.inputSchema(/* ... */)
```

The `schema` method is deprecated and will be removed in a future version.


### Safe action result always defined

The result of action execution is now always defined, even when there are validation errors:

```typescript
// v7
const result = await action(input);
if (result.data) {
  // Only access data if it exists
}

// v8
const result = await action(input);
// result.data is always defined (unless there's a server error)
```


### Deprecated `useStateAction` hook

The `useStateAction` hook has been deprecated. Consider using the regular `useAction` hook instead.

## Improved error handling

Thrown errors in hooks now properly set the `hasErrored` status and trigger the `onError` callback:

```typescript
const { execute, hasErrored } = useAction(action, {
  onError: (error) => {
    console.error("Action failed:", error);
  }
});
```

## Requirements

next-safe-action version 8 requires Next.js 14 and React 18.2.0 or later to work.

## What about v7?

You can still keep using version 7 and eventually upgrade to version 8. Note that version 7 is frozen and no new features will be released in the future for it. v7 documentation can still be found [here](https://v7.next-safe-action.dev).