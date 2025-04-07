---
sidebar_position: 6
description: Learn how to extend previous schema(s)
---

# Extend previous schema(s)

Sometimes it's useful to define an action "template" with a base input schema and then extend it with additional properties. This can be done inside the [`inputSchema`](/docs/define-actions/instance-methods#inputschema) method by passing an async function that has the previous schema as its argument. See the example below:

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
  .inputSchema(async (prevSchema) => {
    // Here we extend the previous schema with `password` property.
    return prevSchema.extend({ password: z.string() });
  })
  .inputSchema(async (prevSchema) => {
    // Here with `age` property.
    return prevSchema.extend({ age: z.number().positive() });
  })
  // highlight-end
  // `parsedInput` will be an object with `username`, `password` and `age` properties.
  .action(async ({ parsedInput: { username, password, age } }) => { 
    // Do something useful here...
  });
```

Note that if you don't use `prevSchema` inside the `inputSchema` method, the previous schema(s) will be overwritten.