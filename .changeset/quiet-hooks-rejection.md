---
"next-safe-action": patch
---

fix(hooks): stop `useAction` and `useOptimisticAction` from leaking an unhandled promise rejection when the action call itself rejects (offline client, stale bundle after a deploy). The error still reaches the caller through `status`, `onError` with `thrownError`, and the `executeAsync` rejection. Closes #482.
