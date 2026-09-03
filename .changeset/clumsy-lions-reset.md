---
"next-safe-action": patch
---

Fix `reset()` letting the queued dispatches of `useStateAction` and `useOptimisticStateAction` write to the server after the user had discarded them.

Both hooks queue dispatches through `useActionState`, and `reset()` marked every dispatch made before it as discarded: its result, its errors and its callbacks were all ignored when it settled. The dispatches themselves still ran, though, including the ones that were only *queued* and had never contacted the server. So a `reset()` in the middle of a draining queue performed exactly the writes the user had just thrown away, and a `revalidatePath()` inside any of them pushed a fresh `currentState` that landed *after* the reset, pulling the confirmed state into a value that was never on screen. With `useOptimisticStateAction` this reads as the list snapping to an order the user never chose, some seconds after resetting.

A dispatch that a `reset()` marked stale before it took its turn in the queue now never calls the action at all: nothing had been sent for it, so the write is skipped, its `executeAsync` promise resolves with `{}`, and none of its callbacks fire. The dispatch that was already awaiting the server still completes, because React cannot recall it.

Also fixed in `useOptimisticStateAction`: a `currentState` that committed while the queue was still draining applied the already-settled optimistic payloads a second time. React holds every payload for as long as the queue has work, and the hook relies on that to keep overlapping changes on screen, which is safe only while the confirmed base does not move. An urgent prop update moves it, and the settled payloads then folded on top of a base that already carried them (three queued appends over an acknowledged base rendered `["x", "x", "y", "z"]` instead of `["x", "y", "z"]`). Each payload now records its dispatch, and a prop that arrives mid-queue stops the payloads of dispatches that have already settled, while the pending ones keep folding. Next's own revalidation path is unaffected: it commits on the same suspended lane the queue waits on, so it never lands mid-queue.
