---
sidebar_position: 3
description: Hook callbacks are a way to perform custom logic based on the current action execution status.
---

# Callbacks

Hook callbacks are a way to perform custom logic based on the current action execution status. You can provide them both to `useAction` and `useOptimisticAction` in the last optional argument, which is an object. All of them are optional:

```tsx
const action = useAction(testAction, {
  onExecute: (input) => {},
  onSuccess: (data, input, reset) => {},
  onError: (error, input, reset) => {},
  onSettled: (result, input, reset) => {},
});
```

Here is the full list of callbacks, with their behavior explained. All of thme are optional and have return type `void` or `Promise<void>` (normal or async functions with no return):

| Name         | [`HookActionStatus`](/docs/types#hookactionstatus) state               | Arguments                                                                                                |
|--------------|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| `onExecute?` | `"executing"`                                                          | `input: z.input<Schema>`                                                                                 |
| `onSuccess?` | `"hasSucceeded"`                                                        | `data: Data`,<br/> `input: z.input<Schema>`,<br/> `reset: () => void`                                    |
| `onError?`   | `"hasErrored"`                                                         | `error: Omit<HookResult<Schema, Data>, "data">`,<br/> `input: z.input<Schema>`,<br/> `reset: () => void` |
| `onSettled?` | `"hasSucceeded"` or `"hasErrored"` (after `onSuccess` and/or `onError`) | `result: HookResult<Schema, Data>`,<br/> `input: z.input<Schema>`,<br/> `reset: () => void`              |