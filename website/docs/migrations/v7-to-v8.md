---
sidebar_position: 4
description: Learn how to migrate from next-safe-action version 7 to version 8.
sidebar_label: v7 to v8
---

# Migration from v7 to v8

Version 8 introduces significant changes to the validation system, improves type safety for metadata, and fixes next/navigation behaviors.

## What's new?

### [BREAKING] Standard Schema support

The biggest change in v8 is the switch to [Standard Schema](https://github.com/standard-schema/standard-schema) for validation. This removes the need for external validation adapters and simplifies the API. You can find the supported libraries [here](https://github.com/standard-schema/standard-schema?tab=readme-ov-file#what-schema-libraries-implement-the-spec).

```typescript title="v7 - using Valibot"
import { createSafeActionClient } from "next-safe-action";
import { valibotAdapter } from "next-safe-action/adapters/valibot";

export const actionClient = createSafeActionClient({
  validationAdapter: valibotAdapter(),
});
```

```typescript title="v8 - using Standard Schema"
import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient();
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

### Navigation callbacks

A new `onNavigation` callback has been added to both actions and hooks, which is triggered when navigation functions from `next/navigation` are called in action execution:

```typescript
import { useAction } from "next-safe-action/hooks";
import { redirect } from "next/navigation";

// In the action definition
const action = actionClient
  .inputSchema((s) => ({ id: s.string() }))
  .action(async ({ parsedInput: { id } }) => {
    // ... process data
    redirect(`/details/${id}`);
  });

// In the component
const { execute } = useAction(action, {
  onNavigation: ({ type, destination }) => {
    console.log(`Navigation of type ${type} to ${destination}`);
  }
});
```

## BREAKING CHANGES

### Removal of validation adapters

All external validation library adapters have been removed in favor of the built-in Standard Schema. This means you need to migrate your validation schemas to Standard Schema syntax.

### `schema` method renamed to `inputSchema`

The `schema` method has been renamed to `inputSchema` to better reflect its purpose:

```typescript
// v7
actionClient.schema(/* ... */)

// v8
actionClient.inputSchema(/* ... */)
```

The `schema` method is deprecated and will be removed in a future version.

### Bind args validation errors now throw instead of returning

When using bind arguments with invalid data, errors are now thrown instead of being returned as part of the result object:

```typescript
// v7
const result = await action.bind(null, invalidBindArg)(input);
if (result.validationErrors) {
  // Handle bind args validation errors
}

// v8
try {
  const result = await action.bind(null, invalidBindArg)(input);
} catch (error) {
  // Bind args validation errors now throw
}
```

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

### Removed `executeOnMount` functionality from hooks

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