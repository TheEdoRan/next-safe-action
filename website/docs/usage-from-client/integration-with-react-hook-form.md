---
sidebar_position: 3
description: Integrate next-safe-action with React Hook Form
---

# React Hook Form integration

next-safe-action works greatly in combo with [React Hook Form](https://react-hook-form.com/).

Here's a guide on how to work with the two libraries together.

:::info
These code snippets are from the [React Hook Form example](https://next-safe-action.vercel.app/react-hook-form) of the example application.
:::

## 1. Define a validation schema

First of all, we need to define the validation schema. We'll use Zod in this case as our validation library. Note that the schema, in this case, is defined in a separate file, and not in the same file as our action. We have to do this because we need to import the same schema from the actions file, which never leaves the server context, and the Client Component where we use `useForm` from React Hook Form:

```typescript title="validation.ts"
import { z } from "zod";

export const schema = z.object({
  productId: z.string(),
});
```

## 2. Define the action

Here we define our action. The only difference is that we will import the schema from the file we just created:

```typescript title="buyproduct-action.ts"
"use server";

import { action } from "@/lib/safe-action";
import { schema } from "./validation";

export const buyProduct = action(schema, async ({ productId }) => {
  // We're just returning the productId passed to the action here.
  return {
    productId,
  };
});
```

## 3. Define the form

Lastly, we have to define the form. We'll use `useForm` from React Hook Form to handle the form submission and client side validation. This is a basic example, but can be easily adapter to your needs. Note that we're directly importing the action we just created, instead of using the `useAction` hook from next-safe-action. This is because we're awaiting the action inside the form submit handler.

```typescript title="buyproduct-form.tsx"
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { buyProduct } from "./buyproduct-action";
import { schema } from "./validation";

export default function BuyProductForm() {
  const { register, handleSubmit } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        const res = await buyProduct(data);
        // Do something useful with the result.
      })}>
      <input {...register("productId")} placeholder="Product ID" />
      <button type="submit">Buy product</button>
    </form>
  );
}
```