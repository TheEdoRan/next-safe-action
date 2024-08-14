---
sidebar_position: 6
description: Check the current action execution status.
---

# Check action status

You can check the current action execution status using either the `status` property or the shorthand properties returned by all hooks.

## Via `status` property

`status` property is a discriminated string, so it can only be one of the following values at any given time: `idle`, `executing`, `hasSucceeded`, `hasErrored`.


## Via shorthand properties

Shorthand properties are convenience booleans that are `true` if the corresponding action status string is of the same value. Other than `isIdle`, `isExecuting`, `hasSucceeded` and `hasErrored`, also `isTransitioning` and `isPending` are returned by all three hooks.

### Difference between `isExecuting`, `isTransitioning`, and `isPending`

The difference between these three properties is that `isExecuting` is `true` when the Server Action is actually being executed, `isTransitioning` is true when the under the hood value from `useTransition` hook is `true` (so, when the transition is in progress), and `isPending` is `true` when `isExecuting` or `isTransitioning` are `true`.

The safest and recommended way to check if the action is in progress is to use `isPending` property, because using just `isExecuting` could cause some weird glitches when navigation functions like `redirect` are used inside the Server Action.