---
"next-safe-action": patch
---

Fix hook state being frozen for the whole request when an action is dispatched from inside a React transition, most visibly with `<form action={execute}>`.

React invokes a form action inside its own transition, so the state the hooks set at dispatch time (`isExecuting`, `isIdle`, `input`, cleared errors) inherited the transition lane. Next's router suspends on that same lane while it awaits the RSC response, and a render whose lanes are only transition lanes and that suspends is never committed. Everything scheduled at dispatch was therefore withheld until the action settled.

The dispatch-time state is now also applied from a microtask, which runs after React has restored the current transition, so it lands on the default lane and commits immediately. Outside a transition the repeat is a no-op, so nothing changes on paths that already worked.

What this fixes, for `<form action={execute}>` and any `execute` called inside a caller's own `startTransition`:

- `isPending` and `isExecuting` stayed `false`, and `status` stayed `"idle"`, for the entire request. ([#470](https://github.com/next-safe-action/next-safe-action/issues/470))
- `input` was not readable until the action settled.
- `onExecute` never fired at all in `useAction`, and fired only after the action had already completed in `useOptimisticAction`.
- In `useStateAction`, the dispatch immediately following a `reset()` reported nothing at all: `status` read `"idle"` with every shorthand flag `false` for the whole request. On the dispatches that did report, `onExecute` received a stale `input`, because React flips `useActionState`'s pending flag at sync priority, ahead of the dispatch state. `onExecute` now fires once per dispatch, on the first commit that carries the real input.

Also fixed, found while verifying the above: a `useStateAction` whose action resolves `undefined` re-fired `onSuccess` and `onSettled` on every unrelated re-render. The result was normalized in the render body, so each render allocated a fresh object, and the callbacks use result identity to tell a new execution from a replay. It is now normalized where it is stored, matching `useAction`.

`isPending`'s formula is unchanged, so a mid-flight `reset()` still reports idle immediately while the uncancellable transition settles. The `useAction` bugs above are not specific to 8.6.0: before 8.6.0 `isPending` happened to be `true` because it was derived from `isTransitioning` alone, which masked the underlying state machine rather than fixing it.
