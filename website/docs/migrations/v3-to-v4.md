---
sidebar_position: 1
description: Learn how to migrate from next-safe-action version 3 to version 4.
sidebar_label: v3 to v4
---

# Migration from v3 to v4

Version 4.x.x of `next-safe-action` introduced many improvements, some fixes, and some breaking changes.

This guide will help you migrate from v3 to v4, hopefully without too much trouble.

:::note
You can continue to use version 3 of the library if you want to. There are no security implications, since version 4 introduced some new features and changed some functions and properties names. No security patches were committed to v4, at least for the time being, so v3 is currently still safe to use. You'll not get new features in v3, though.
:::

## BREAKING CHANGES

### Safe action client

- `buildContext()` function is now called `middleware()`, and it can still return a context object.
- `serverErrorLogFunction()` function is now called `handleServerErrorLog()`.

### Hooks

- `res` object is now called `result`.
- Action status before was reported through returned `hasExecuted`, `isExecuting`, `hasSucceeded` and `hasErrored` properties. Now there's a single property of type string called `status` that contains the current action status, and it can be `"idle"`, `"executing"`, `"hasSucceeded"` or `"hasErrored"`.
- Reorganized callbacks arguments for `onSuccess` and `onError`:
  - from `onSuccess(data, reset, input)` to `onSuccess(data, input, reset)`
  - from `onError(error, reset, input)` to `onError(error, input, reset)`
- `useOptimisticAction` just required a safe action and an initial optimistic state before. Now it requires a `reducer` function too, that determines the behavior of the optimistic state update when the `execute` function is called. Also, now only one input argument is required by `execute`, instead of two. The same input passed to the actual safe action is now passed to the `reducer` function too, as the second argument (`input`). More information about this hook can be found [here](/docs/execute-actions/hooks/useoptimisticaction).

### Types

- `ActionDefinition` is now called `ServerCode`.
- `HookRes` is now called `HookResult`.
- `ClientCaller` is now called `SafeAction`.

## New features

### Hooks

- Added optional `onSettled` callback for `useAction` and `useOptimisticAction` hooks. It gets executed if the action succeeds or fails, after `onSuccess` and `onError`.

## Fixes

- Fixed an issue with Zod input validation parsing. Before, if an async `superRefine()` was used when defining the schema, the validation would fail, resulting in a `serverError` response for the client. Now the validation is done through `safeParseAsync()`, so the problem is gone.

## Misc

### Safe action client

- Now `Context` returned by `middleware()` (previously called `buildContext()` in v3) is not required to be an object anymore, it can be of any type.

### Hooks

- Before, you had to return an object from actions you wanted to execute via `useOptimisticAction` hook. Now, with the new exposed `reducer` function (see above), you can return anything you want from action server code body.
