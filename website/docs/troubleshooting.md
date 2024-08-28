---
sidebar_position: 8
description: Troubleshoot common issues with next-safe-action.
---

# Troubleshooting

## TypeSchema issues (pre v7.2.0)

**NOTE**: next-safe-action used TypeSchema up to version 7.1.3. If you use version 7.2.0 or later, these issues are fixed.

### `Schema` and `parsedInput` are typed `any` (broken types) and build issues

At this time, TypeSchema (the library used under the hood up to v7.1.3 for supporting multiple validation libraries) doesn't work with TypeScript >= 5.5; the resulting types for inputs and schemas are `any`, so type inference is broken.

If you're in this situation, please upgrade to v7.2.0 or later to fix the issue.

### TypeSchema issues with Edge Runtime

TypeSchema enables support for many validation libraries, via adapters. However, since it relies on the dynamic import feature, it won't work with the Edge Runtime. Please upgrade to v7.2.0 or later to fix the issue.

## TypeScript error in monorepo

If you use next-safe-action in a monorepo, you'll likely experience this error:

```
Type error: The inferred type of 'action' cannot be named without a reference to '...'. This is likely not portable. A type annotation is necessary.
```

You can set this option in your `tsconfig.json` to remove the error:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "baseUrl": "."
  }
}
```

Find more information about this in [this issue](https://github.com/TheEdoRan/next-safe-action/issues/64) on GitHub.