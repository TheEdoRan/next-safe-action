---
"next-safe-action": patch
---

Fix `onNavigation` and `onSettled` firing twice for a single `redirect` in `useAction`, `useOptimisticAction` and `useStateAction`. The redirect is delivered on the first commit that carries it, before the status reaches `hasNavigated`, and the later `hasNavigated` commit re-fired the same navigation. Each navigation now fires the callbacks exactly once.
