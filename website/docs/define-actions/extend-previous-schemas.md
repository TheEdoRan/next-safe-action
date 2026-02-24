---
sidebar_position: 6
description: Learn how to extend previous schema(s)
---

# Extend previous schema(s)

Sometimes it's useful to define an action "template" with a base input schema and then extend it with additional properties. This can be done inside the [`inputSchema()`](/docs/define-actions/instance-methods#inputschema) method by passing an `async` function that receives the previous schema as the first argument and an `opts` object (with `clientInput`) as the second argument. See the example below:

```typescript
"use server";

import { actionClient } from "@/lib/safe-action";
import { z } from "zod";

const inputSchema = z.object({
  username: z.string(),
});

const myAction = actionClient
  .inputSchema(inputSchema)
  // highlight-start
  .inputSchema(async (prevSchema, _opts) => {
    // Here we extend the previous schema with `password` property.
    return prevSchema.extend({ password: z.string() });
  })
  .inputSchema(async (prevSchema, _opts) => {
    // Here with `age` property.
    return prevSchema.extend({ age: z.number().positive() });
  })
  // highlight-end
  // `parsedInput` will be an object with `username`, `password` and `age` properties.
  .action(async ({ parsedInput: { username, password, age } }) => { 
    // Do something useful here...
  });
```

If you need to access the raw client input while extending (or replacing) a schema, use the `opts.clientInput` property:

```typescript
"use server";

import { actionClient } from "@/lib/safe-action";
import { z } from "zod";

const myAction = actionClient
  // highlight-start
  // `prevSchema` is always the first argument.
  // If you don't need it, use `_` as placeholder: `(_, { clientInput }) => ...`.
  // highlight-end
  .inputSchema(async (_, { clientInput }) => {
    // Do something with `clientInput`...
    console.log(clientInput);

    return z.object({
      type: z.string(),
    });
  })
  .action(async ({ parsedInput }) => {
    // Do something useful here...
  });
```

Note that if you don't use `prevSchema` inside the `inputSchema()` callback, the previous schema(s) will be overwritten.

Only `async` callbacks are treated as schema extension/replacement callbacks at runtime. If you pass a validator directly (including a callable Standard Schema validator), it is treated as the input validator itself.
