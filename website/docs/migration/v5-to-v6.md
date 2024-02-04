---
sidebar_position: 3
description: Learn how to migrate from next-safe-action version 5 to version 6.
title: v5 to v6
---

# Migration from v5 to v6

## What's new?

With next-safe-action version 6, you can now use a wide range of validation libraries, even multiple and custom ones at the same time, thanks to the great [TypeSchema](https://typeschema.com/) library. You can find supported libraries [here](https://typeschema.com/#coverage).

Existing code will not be affected, since Zod is supported by TypeSchema. However, now you can for example define a new safe action using [Yup](https://github.com/jquense/yup) or [Valibot](https://valibot.dev/), while still keeping existing actions with Zod validation, and everything will be handled internally by next-safe-action, thanks to the TypeSchema abstractions.

## BREAKING CHANGES

### Action result object

- Property `validationError` is now called `validationErrors`.

### Safe action client

- `handleReturnedServerError()` function now directly returns the server error message as a `string`, instead of a `{ serverError: string }` object.

### Hooks

Hooks are now exported from `next-safe-action/hooks` instead of `next-safe-action/hook`.

### Types

- `ServerCode` is now called `ServerCodeFn`.

## Misc changes

### Types

- Exported new `SafeClientOpts` type, which represents the options for the safe action client, used internally by `createSafeActionClient()` function.