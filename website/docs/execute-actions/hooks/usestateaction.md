---
title: useStateAction() [DEPRECATED]
sidebar_position: 3
description: Learn how to use the useStateAction hook.
---

# ~~`useStateAction()`~~

:::warning deprecation notice
The `useStateAction()` hook is deprecated since version 8. Directly use the [`useActionState()`](https://react.dev/reference/react/useActionState) hook from React instead.
:::

### `useStateAction()` documentation

You can access the documentation for the deprecated `useStateAction()` hook in the [v7 docs](https://v7.next-safe-action.dev/docs/execute-actions/hooks/usestateaction).

### From v8 onwards

The `useStateAction()` hook has been deprecated in favor of the [`useActionState()`](https://react.dev/reference/react/useActionState) hook from React, which was used anyway under the hood. This is because the `useStateAction()` hook, while adding useful features, prevented progressive enhancement from working, since it wrapped the `useActionState()` hook with additional functionality that only worked with JavaScript enabled.

Note that you can also use "stateless" actions with forms, as described in [this section](/docs/recipes/form-actions#stateless-form-actions).

### Example

Take a look at [this section](/docs/recipes/form-actions#stateful-form-actions) of the documentation for an example of how to use the `useActionState()` hook to create a stateful action.