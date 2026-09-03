---
"@next-safe-action/adapter-better-auth": patch
---

Stop tsdown from adding a `.js` extension to `next/navigation`. Importing `next/navigation.js` breaks Next.js builds for Route Handlers that use actions that use the better-auth adapter.
