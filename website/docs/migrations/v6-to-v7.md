---
sidebar_position: 4
description: Learn how to migrate from next-safe-action version 6 to version 7.
sidebar_label: v6 to v7
---

# Migration from v6 to v7

## What's new?

Well, pretty much everything. Version 7 now works using methods; you might be familiar with this design if you have worked with [tRPC](https://trpc.io/) or [Kysely](https://kysely.dev/). A complete rewrite of the library in this direction was needed to vastly improve next-safe-action's APIs, and ensure that future versions will not break them (unless React/Next.js APIs change under the hood). The new design is much more resilient, powerful and flexible. 

## TL;DR

_But please still read this migration guide carefully before upgrading to v7._

Assuming you're using Zod, in previous versions, you'd define an auth action client and then an action like this:

```typescript title="action-client-v6.ts"
import { createSafeActionClient } from "next-safe-action";
import { cookies } from "next/headers";

// Base client
export const baseActionClient = createSafeActionClient();

// Auth client
export const authActionClient = createSafeActionClient({
  async middleware(parsedInput) {
    const session = cookies().get("session")?.value;

    if (!session) {
      throw new Error("Session not found!");
    }

    const userId = await getUserIdFromSessionId(session);

    if (!userId) {
      throw new Error("Session is not valid!");
    }

    return { userId };
  },
});
```


```typescript title="action-v6.ts"
"use server";

import { authActionClient } from "@/lib/safe-action";
import { z } from "zod";

export const editProfile = authActionClient(z.object({ username: z.string() }), async ({ username }, { ctx: { userId } }) => {
  await saveNewUsernameInDb(userId, username);

  return {
    updated: true,
  }
})
```

The same behavior can be achieved in v7 with the following refectored code:

```typescript title="action-client-v7.ts"
import { createSafeActionClient } from "next-safe-action";
import { cookies } from "next/headers";

// Base client
export const actionClient = createSafeActionClient();

// Auth client
export const authActionClient = actionClient.use(async ({ next, ctx }) => {
  const session = cookies().get("session")?.value;

  if (!session) {
    throw new Error("Session not found!");
  }

  const userId = await getUserIdFromSessionId(session);

  if (!userId) {
    throw new Error("Session is not valid!");
  }

  return next({ ctx: { userId } });
});
```

```typescript title="action-v7.ts"
"use server";

import { authActionClient } from "@/lib/safe-action";
import { z } from "zod";

export const editProfile = authActionClient
  .schema(z.object({ username: z.string() }))
  .action(async ({ parsedInput: { username }, ctx: { userId } }) => {
    await saveNewusernameInDb(userId, username)

    return {
      updated: true,
    }
  });
```

## New features

### [Allow setting validation errors in action server code function](https://github.com/TheEdoRan/next-safe-action/issues/62)

Sometimes it's useful to set custom validation errors in the action server code function, for example when the user wants to log in, but there was a problem with the email or password fields. next-safe-action v7 introduces a new function called [`returnValidationErrors`](/docs/define-actions/validation-errors#returnvalidationerrors) that allows you to do that.

### [Support schema nested objects validation](https://github.com/TheEdoRan/next-safe-action/issues/51)

Before v7, next-safe-action allowed you to define schemas with nested objects, but validation errors were not correctly set for nested fields. Version 7 of the library changes the returned errors to be an object with nested fields, that emulates Zod's [`format`](https://zod.dev/ERROR_HANDLING?id=formatting-errors) method.

### [Support middleware chaining](https://github.com/TheEdoRan/next-safe-action/issues/90)

This is a core change in next-safe-action v7. In previous versions, you could define just one "monolithic" middleware at the instance level. So, the previous workflow was to define multiple safe action clients, each one with its own middleware.

With version 7, you can chain multiple middleware functions using the [`use`](/docs/define-actions/instance-methods#use) method, both at the instance level and at the action level. This is explained in detail in the [middleware page](/docs/define-actions/middleware) of the documentation. The new design is much more flexible and powerful, allowing you to do things that just couldn't be done before, such as extending context, logging action execution, [integrating with third party systems for error reporting](https://github.com/TheEdoRan/next-safe-action/issues/39#issuecomment-2062387039), etc.

### [Generic type for `serverError`](https://github.com/TheEdoRan/next-safe-action/issues/86)

The `serverError` property of the [action result object](/docs/define-actions/action-result-object) is now of generic type. By default it's a `string` with a default value of "Something went wrong while executing the operation.". You can customize error value and type using the [`handleServerError`](/docs/define-actions/create-the-client#handleservererror) initialization function, just like pre-v7. Basically, what you return from that function is what `serverError` will be on the client.

### [Support binding additional arguments](https://github.com/TheEdoRan/next-safe-action/issues/29)

Next.js allows you to [pass additional arguments to the action](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#passing-additional-arguments) using JavaScript `bind` method. This approach has the advantage of supporting progressive enhancement.

next-safe-action v7 supports bind arguments via the [`bindArgsSchemas`](/docs/define-actions/instance-methods#bindargsschemas) method.

### [Support setting default validation errors shape per instance](https://github.com/TheEdoRan/next-safe-action/issues/153)

By default, next-safe-action v7 returns validation errors in an object of the same shape as Zod's [`format`](https://zod.dev/ERROR_HANDLING?id=formatting-errors) method. You can override this behavior globally by setting the [`defaultValidationErrorsShape`](/docs/define-actions/create-the-client#defaultvalidationerrorsshape) optional property to `flattened` in `createSafeActionClient` method. Doing so, the validation errors are returned in the shape of the Zod's [`format`](https://zod.dev/ERROR_HANDLING?id=formatting-errors) method. If you need a custom format for a specific action, you can override the default shape using the `handleValidationErrorsShape` and `handleBindArgsValidationErrorsShape` optional functions in `schema` and `bindArgsSchemas` methods, as explained below.

### [Support custom validation errors shape](https://github.com/TheEdoRan/next-safe-action/issues/98)

As already said above, by default version 7 now returns validation errors in the same format of the Zod's [`format`](https://zod.dev/ERROR_HANDLING?id=formatting-errors) method.

This is customizable by using the `handleValidationErrorsShape`/`handleBindArgsValidationErrorsShape` optional functions in `schema`/`bindArgsSchemas` methods. Check out [this page](/docs/define-actions/validation-errors#customize-validation-errors-format) for more information. For example, if you need to work with flattened errors for a specific action, next-safe-action conveniently provides two functions to do that: [`flattenValidationErrors` and `flattenBindArgsValidationErrors`](/docs/define-actions/validation-errors#formatvalidationerrors-utility-function).

### [Allow calling `action` method without `schema`](https://github.com/TheEdoRan/next-safe-action/issues/107)

Sometimes it's not necessary to define an action with input. In this case, you can omit the [`schema`](/docs/define-actions/instance-methods#schema) method and use directly the [`action`/`stateAction`](/docs/define-actions/instance-methods#action--stateaction) method.

### [Support passing schema via async function](https://github.com/TheEdoRan/next-safe-action/issues/155)

When working with i18n solutions, often you'll find implementations that require awaiting a `getTranslations` function in order to get the translations, that then get passed to the schema. Starting from version 7, next-safe-action allows you to pass an async function to the [`schema`](/docs/define-actions/instance-methods#schema) method, that returns a promise of type `Schema`. More information about this feature can be found in [this discussion](https://github.com/TheEdoRan/next-safe-action/discussions/111) on GitHub and in the [i18n](/docs/recipes/i18n) recipe page.

### [Support action execution callbacks](https://github.com/TheEdoRan/next-safe-action/issues/162)

It's sometimes useful to be able to execute custom logic on the server side after an action succeeds or fails. Starting from version 7, next-safe-action allows you to pass action callbacks when defining an action. More information about this feature can be found [here](/docs/define-actions/action-utils#action-callbacks).

### [Support stateful actions using React `useActionState` hook](https://github.com/TheEdoRan/next-safe-action/issues/91)

React added a hook called `useActionState` that replaces the previous `useFormState` hook and improves it. next-safe-action v7 uses it under the hood in the exported [`useStateAction`](/docs/execute-actions/hooks/usestateaction) hook, that keeps track of the state of the action execution.

Note that this hook expects as argument actions defined using the `stateAction` method, and not the usual `action` method. Find more information about these two methods [here](/docs/define-actions/instance-methods#action--stateaction).

:::warning important
The `useActionState` hook requires Next.js >= 15 to work, because previous versions do not support the React's [`useActionState`](https://react.dev/reference/react/useActionState) hook that is used under the hood. In the meantime, you can use the [`stateAction`](/docs/define-actions/instance-methods#action--stateaction) method manually with React 18's `useFormState` hook.

The `useActionState` hook is exported from `next-safe-action/stateful-hooks` path, unlike the other two hooks. This is because it uses React 19 features and would cause build errors in React 18.
:::

### [Return input from hooks](https://github.com/TheEdoRan/next-safe-action/issues/117)

Sometimes it's useful to access the input passed to an action when using hooks. Starting from version 7, `input` property is returned from hooks.

### [Return shorthand statuses from hooks](https://github.com/TheEdoRan/next-safe-action/issues/133)

Starting from version 7, `isIdle`, `isExecuting`, `hasSucceeded` and `hasErrored` are returned from hooks, in addition to the `status` property. This is the same behavior of next-safe-action pre-v4 and very similar to the [TanStack Query](https://tanstack.com/query/latest) API.

### [Return `executeAsync` from `useAction` and `useOptimisticAction` hooks](https://github.com/TheEdoRan/next-safe-action/issues/146)

Sometimes it's useful to await the result of an action execution when using actions via hooks. Starting from version 7, `executeAsync` is returned from `useAction` and `useOptimisticAction` hooks. It's essentially the same as the original safe action function, with the added benefits of the hooks execution behavior. Note that it's currently not possible to return this function from the `useStateAction` hook, due to internal React limitations.

## Refactors

### `serverCodeFn` signature

Previously, `serverCodeFn` had two arguments: `parsedInput` and `ctx`. Now, it only has one argument, which is an object that contains `parsedInput` and `ctx`, and other useful properties. In the case of [`stateAction`](/docs/define-actions/instance-methods#action--stateaction) method, `serverCodeFn` also has an additional argument, which is an object that contains the previous result of the action. Find more information about `serverCodeFn` [here](/docs/define-actions/instance-methods#servercodefn).

### `useOptimisticAction` signature

The function signature for `useOptimisticAction` has been updated to be much more clear and readable. Before, you had to pass `currentState` and `updateFn` as the second and third argument of the hook. Now, the first argument is the safe action, and additional required and optional properties are placed inside the second argument of the hook, which is an object.

Other than that, now `currentState` is unlinked from the safe action's return value. The action purpose in optimistic state updates is just to make mutations of data. Then, the fresh data is refetched from the parent Server Component, so it didn't make sense to lock the type of `currentState` to the action's return type. This is explained in detail [here](https://github.com/TheEdoRan/next-safe-action/discussions/127#discussioncomment-9480520) and [here](https://github.com/TheEdoRan/next-safe-action/pull/134).

Find more information about the updated `useOptimisticAction` hook [here](/docs/execute-actions/hooks/useoptimisticaction).

### Hook callbacks arguments

Previously, there were multiple arguments in hook callbacks. Now, metadata is passed inside a single object that is the first argument of each function. Find more information about the updated callbacks [here](/docs/execute-actions/hooks/hook-callbacks).

### Action metadata

In version 6, you could pass metadata to actions via the third argument of the safe action function, after `serverCodeFn`. In version 7, there's a dedicated `metadata` method that lets you define useful data for the action execution. This data can then be accessed in middleware functions and `serverCodeFn`. Find more information about the `metadata` method [here](/docs/define-actions/instance-methods#metadata).

## Internal changes

### TypeSchema update

TypeSchema was updated to v0.13, so now, if you want to use a validation library other than Zod, you also need to install the related [TypeSchema adapter](https://typeschema.com/#coverage).

## Requirements

next-safe-action version 7 requires Next.js 14 and React 18.2.0 or later to work. For `useActionState` hook, the minimum required Next.js version is 15, since previous versions don't support the React's `useStateAction` hook that is used under the hood. The `useActionState` hook is exported from `next-safe-action/stateful-hooks` path.

## What about v6?

You can still keep using version 6 and eventually upgrade to version 7. Note that version 6 is frozen and no new features will be released in the future for it. v6 documentation can still be found [here](https://v6.next-safe-action.dev).