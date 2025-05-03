---
sidebar_position: 5
description: Hook callbacks are a way to perform custom logic based on the current action execution status.
---

# Hook callbacks

- `onExecute`: called when `status` is `"executing"`.
- `onSuccess`: called when `status` is `"hasSucceeded"`.
- `onError`: called when `status` is `"hasErrored"`.
- `onNavigation`: called when `status` is `"hasNavigated"`.
- `onSettled`: called when `status` is either `"hasSucceeded"` or `"hasErrored"`.

Hook callbacks are a way to perform custom logic based on the current action execution status. You can pass them to the three hooks in the `utils` object, which is the second argument. All of them are optional and don't return anything, they can also be async or not:

```tsx
const action = useAction(testAction, {
  onExecute: ({ input }) => {},
  onSuccess: ({ data, input }) => {},
  onError: ({ error, input }) => {},
  onNavigation: ({ input, navigationKind }) => {},
  onSettled: ({ result, input }) => {},
});
```