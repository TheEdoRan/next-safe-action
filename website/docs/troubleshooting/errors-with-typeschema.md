---
sidebar_position: 1
description: Knwon errors with TypeSchema.
---

# Errors with TypeSchema

[TypeSchema](https://typeschema.com/) library relies on dynamic imports to support a wide range of validation libraries. It works well most of the time, but in some cases it can cause unexpected errors.

For instance, there's a known bug with TypeSchema and Next.js edge runtime. When parsing and validating client input, the server outputs the following error:

```
TypeError [ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING]:
  A dynamic import callback was not specified.
```

To solve this, next-safe-action exports a copy of the safe action client from the `/zod` path, with the exact same functionality as the default one. The only difference is that this client **requires** Zod to work, as it supports just that validation library.

So, after you installed `next-safe-action`, `zod` and `@typeschema/zod` packages, as explained in the [installation](/docs/getting-started#installation) section of the getting started page, you just need to update the import path for `createSafeActionClient`, in the `safe-action.ts` file:

```typescript title="src/lib/safe-action.ts"
// Update import path here with /zod
import { createSafeActionClient } from "next-safe-action/zod";

export const actionClient = createSafeActionClient();
```

`next-safe-action/zod` exports the same client, variables, functions and types as the default path.