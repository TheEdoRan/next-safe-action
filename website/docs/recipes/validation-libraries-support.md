---
sidebar_position: 2
description: Use a validation library of your choice with next-safe-action.
---

# Validation libraries support

Starting from version 6.0.0, and up to version 7.1.3, next-safe-action used [TypeSchema](https://typeschema.com/) to enable support for multiple validation libraries. This has worked pretty well, but caused some issues too, such as the [Edge Runtime incompatibility](/docs/troubleshooting#typeschema-issues-with-edge-runtime) or [lack of support for TypeScript >= 5.5](/docs/troubleshooting#schema-and-parsedinput-are-typed-any-broken-types-and-build-issues).

To solve these issues, next-safe-action v7.2.0 and later versions ship with a built-in modular support for multiple validation libraries, at this time: Zod, Valibot and Yup.

If you used a TypeSchema adapter before, you should uninstall it, since you just need the validation library of your choice from now on.

The configuration is pretty simple. If you use Zod, you don't have to do anything. If you choose to use Valibot or Yup, other than obviously installing the validation library itself, you need to specify the correct validation adapter when you're initializing the safe action client:


For Valibot:

```typescript title="@/lib/safe-action.ts"
import { createSafeActionClient } from "next-safe-action";
import { valibotAdapter } from "next-safe-action/adapters/valibot"; // import the adapter

export const actionClient = createSafeActionClient({
  validationAdapter: valibotAdapter(), // <-- and then pass it to the client
  // other options here...
});
```

For Yup:

```typescript title="@/lib/safe-action.ts"
import { createSafeActionClient } from "next-safe-action";
import { yupAdapter } from "next-safe-action/adapters/yup"; // import the adapter

export const actionClient = createSafeActionClient({
  validationAdapter: yupAdapter(), // <-- and then pass it to the client
  // other options here...
});
```

And you're done! You could also do the same thing for Zod, but it's not required right now, as it's the default validation library.

If you want more information about the TypeSchema to built-in system change, there's a dedicated discussion on GitHub for that, [here](https://github.com/TheEdoRan/next-safe-action/discussions/201).
