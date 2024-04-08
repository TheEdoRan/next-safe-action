---
sidebar_position: 3
description: Hook callbacks are a way to perform custom logic based on the current action execution status.
---

# Callbacks

Hook callbacks are a way to perform custom logic based on the current action execution status. You can provide them both to `useAction` and `useOptimisticAction` in the last optional argument, which is an object. All of them are optional:

```tsx
const action = useAction(testAction, {
  onExecute: ({ input }) => {},
  onSuccess: ({ data, input, reset }) => {},
  onError: ({ error, input, reset }) => {},
  onSettled: ({ result, input, reset }) => {},
});
```

Here is the full list of callbacks, with their behavior explained. All of them are optional and have return type `void` or `Promise<void>` (async or non-async functions with no return):

| Name         | [`HookActionStatus`](/docs/types#hookactionstatus) state               | Arguments                                                                                                |
|--------------|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| `onExecute?` | `"executing"`                                                          | `{ input: InferIn<S> }`                                                                                 |
| `onSuccess?` | `"hasSucceeded"`                                                        | `{ data: Data`,<br/> `input: InferIn<S>`,<br/> `reset: () => void }`                                    |
| `onError?`   | `"hasErrored"`                                                         | `{ error: Omit<HookResult<S, Data>, "data">`,<br/> `input: InferIn<S>`,<br/> `reset: () => void }` |
| `onSettled?` | `"hasSucceeded"` or `"hasErrored"` (after `onSuccess` and/or `onError`) | `{ result: HookResult<S, Data>`,<br/> `input: InferIn<S>`,<br/> `reset: () => void }`              |