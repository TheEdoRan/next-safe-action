---
"next-safe-action": minor
---

Add `useOptimisticStateAction`, the optimistic hook for stateful actions.

`useOptimisticAction` is last-write-wins: when two executions overlap, the newer response is kept and the older discarded. That is correct for *replace* semantics, but wrong when changes must accumulate, for example reordering an item and then reordering it again before the first save lands.

`useOptimisticStateAction` is built on React's `useActionState`, so dispatches are queued: each waits for the previous to settle and receives its result as `prevResult`.

```tsx
const { optimisticState, execute } = useOptimisticStateAction(saveLayout, {
	currentState: groups,
	updateFn: layoutReducer,
});
```

Confirmed state is the more recent of the action's successful `data` and the `currentState` option, which covers both shapes of the pattern: an action that returns the full next state owns the confirmed value, an action that returns nothing leaves `currentState` authoritative, and a revalidated `currentState` beats a stale client-side fold.

Details worth knowing:

- Confirmed domain state is tracked separately from the `SafeActionResult` envelope, so a validation or server error rolls back to the last confirmed value instead of blanking the UI.
- `prevResult` handed to the server always carries a `data` branch: after a failed dispatch the hook substitutes the last confirmed state, so one rejected write cannot leave the rest of the queue without a base.
- Callbacks are delivered per dispatch rather than from a render effect, because React withholds `useActionState`'s commit until the whole queue drains and `result`/`status` cannot report intermediate results. They fire just before commit rather than after.
- `currentState` is compared by identity, so pass a stable reference. A derived value (`items.filter(...)`) is a new identity on every render and breaks the same way an inline literal does.
- When the action returns data, that data must be assignable to `State`. This is enforced at the type level, so an action returning some other shape is a compile error. Actions that return nothing are exempt, which is what the pending-changes-list shape relies on.
- A `currentState` that commits while a dispatch is in flight supersedes that dispatch's return value, so a revalidated Server Component payload stays authoritative for everything queued behind it.
- After `reset()`, the next change folds over the restored baseline instead of briefly re-showing the state that was just discarded.
- Internal state is written after commit, never during render, so a render React starts and throws away (a Suspense retry, StrictMode's double invoke) cannot leak uncommitted state into the next dispatch.

`useStateAction` is unchanged in behaviour; both hooks now share one internal implementation. That shared path also picks up three fixes:

- A synchronous throw from a user callback no longer escapes before the dispatch is enqueued, which used to leave `executeAsync` pending forever.
- A raw thrown error now settles the promises of dispatches queued behind it. React clears its whole action queue when an Action rejects, so those promises previously never resolved or rejected.
- A throw from a dispatch that a `reset` already made stale no longer cancels fresh queued work.
