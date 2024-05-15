---
sidebar_position: 5
description: Learn how to check the current action status when using hooks.
---

# Check action status

There are two ways to get the current action status when using hooks:

1. Directly via the `status` property returned by the three hooks.
2. Using utility functions imported from `next-safe-action/status`.

## Utility functions

You can import `isIdle`, `isExecuting`, `hasSucceeded`, and `hasErrored` from `next-safe-action/status`. This emulates the pre v4 implementation, and it's similar to the [Tanstack Query](https://tanstack.com/query/latest) API.

### Why using single `status` property is better?

The reason for the v4 change, other than debloating the hook result object, is that using a single `status` string property is discriminating, i.e. **only one** status can be active at a specific time. Instead, returning multiple functions to check status as before v4, doesn't guarantee the same behavior.

If you use the utility functions imported from `next-safe-action/status` you get the same discriminated status string, thanks to TypeScript's [type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) feature.
