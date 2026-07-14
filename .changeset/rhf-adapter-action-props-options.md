---
"@next-safe-action/adapter-react-hook-form": minor
---

`actionProps` in `useHookFormAction`/`useHookFormOptimisticAction` is now typed as `HookBaseOptions` instead of `HookCallbacks`, so hook configuration options like `throwOnNavigation` can be passed through the adapter. Type-only change.
