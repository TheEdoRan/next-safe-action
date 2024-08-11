---
sidebar_position: 5
description: Learn how to use next-safe-action with a i18n solution.
---

# Extend previous schema

Sometimes it's useful to define an action "template" with a base schema and then extend it with additional properties. This can be done inside the [`schema`](/docs/safe-action-client/instance-methods#schema) method by passing an async function that has the previous schema as its argument. See the example below:

```typescript
"use server";

import { actionClient } from "@/lib/safe-action";
import { z } from "zod";

const schema = z.object({
  username: z.string(),
});

const myAction = actionClient
  .schema(schema)
  .schema(async (prevSchema) => {
    // Here we extend the previous schema with `password` property.
    return prevSchema.extend({ password: z.string() });
  })
  .schema(async (prevSchema) => {
    // Here with `age` property.
    return prevSchema.extend({ age: z.number().positive() });
  })
  // `parsedInput` will be an object with `username`, `password` and `age` properties.
  .action(async ({ parsedInput: { username, password, age } }) => { 
    // Do something useful here...
  });
```

Note that if you don't use `prevSchema` inside the `schema` method, the previous schema(s) will be overwritten.