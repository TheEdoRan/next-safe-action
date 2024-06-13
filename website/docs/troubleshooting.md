---
sidebar_position: 9
description: Troubleshoot common issues with next-safe-action.
---

# Troubleshooting

## Common issues

### TypeSchema issues with Edge Runtime

TypeSchema enables support for many validation libraries, via adapters. However, since it relies on the dynamic import feature, it won't work with the Edge Runtime, so you'll need to use the default Zod client if you want to render on the Edge.

### TypeScript error in monorepo

If you use next-safe-action in a monorepo, you'll likely experience this error:

```
Type error: The inferred type of 'action' cannot be named without a reference to '...'. This is likely not portable. A type annotation is necessary.
```

This error currently affects multiple TypeScript projects, and a viable solution is yet to be found. However, you can set these two options in your `tsconfig.json` to remove that error:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "declaration": false,
    "declarationMap": false,
  }
}
```

Find more information about this in [this issue](https://github.com/TheEdoRan/next-safe-action/issues/64) on GitHub.