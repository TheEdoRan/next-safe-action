---
sidebar_position: 2
description: Learn how to migrate from next-safe-action version 4 to version 5.
sidebar_label: v4 to v5
---

# Migration from v4 to v5

Version 5.x.x of `next-safe-action` is required for Next.js >= 14 applications. 

:::note
You can continue to use version 4 of the library, compatible with Next.js 13: `npm i next-safe-action@4`
:::

## BREAKING CHANGES

Server Actions are now stable, so there's no need to enable them as an experimental feature in your Next.js config file anymore:

```diff title=next.config.js
module.exports = {
-  experimental: {
-    serverActions: true
-  }
}
```

### Internal changes (hooks)

React now exports `useOptimistic` hook, instead of the previous `experimental_useOptimistic`. This is why a new major version of `next-safe-action` is required for Next.js >= 14 apps.