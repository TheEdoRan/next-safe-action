---
"next-safe-action": minor
---

New features:

- Added `returnServerError()` utility to return typed, expected server errors to the client as `result.serverError`, bypassing `handleServerError`. The payload is encoded onto the error `digest`, so it also works inside `"use cache"` scopes with `cacheComponents` enabled.
- Added `initResult` option to `useAction` and `useOptimisticAction` (mirroring `useStateAction`), to seed the hook with an initial result before the first execution. The option is captured once at mount, like React's `useActionState` initial state, and `reset()` restores it. (#427)

Fixes:

- Output schema transforms and defaults are now applied to the returned `data` (and to the `onSuccess` callback). Previously the raw return value of the action was used even when the output schema transformed it, contradicting input validation semantics. If you use transforms in `outputSchema`, the returned data now reflects them.
- `reset()` in `useAction`/`useOptimisticAction` now invalidates in-flight executions, so a pending response can no longer repopulate the hook state after a reset.
- `useStateAction`'s `executeAsync` now supports overlapping invocations: each promise settles with its own execution result. Previously a second overlapping call overwrote the internal resolver, leaving the first promise unsettled and resolving the second with the wrong result.
- `useStateAction`'s `reset()` now marks already-dispatched executions as stale: a dispatch queued before the reset can no longer clear the reset state, consume the `initResult` baseline meant for the next execution, or repopulate errors after the reset.
