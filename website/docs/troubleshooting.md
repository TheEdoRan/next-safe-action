---
sidebar_position: 9
description: Troubleshoot common issues with next-safe-action.
---

# Troubleshooting

## Common issues

### `Schema` and `parsedInput` are typed `any` (broken types) and build issues

At this time, TypeSchema (the library used under the hood for supporting multiple validation libraries) doesn't work with TypeScript >= 5.5; the resulting types for inputs and schemas are `any`, so type inference is broken.

If you're in this situation, you have two paths to choose from to fix it:

1. If you're using a library other than Zod, you have to downgrade your TypeScript version to 5.4 and, assuming you're using VS Code, add the following to your `.vscode/settings.json`, to tell the editor to use the workspace version of TypeScript:

```json title=".vscode/settings.json"
{
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

2. If you're using Zod and TypeScript 5.5, you can install the experimental version of next-safe-action. It shares the same codebase as the stable version, the only difference it's that it supports just Zod. More information about this can be found in [this issue](https://github.com/TheEdoRan/next-safe-action/issues/180#issuecomment-2201607407) on GitHub. You can install it in your project by running the following command:
  
```bash npm2yarn
npm i next-safe-action@experimental
```

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