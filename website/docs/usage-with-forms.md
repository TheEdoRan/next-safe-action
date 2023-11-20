---
sidebar_position: 4
description: Learn how to execute safe actions as form actions.
---

# Usage with forms

You can also pass an action to a form in a Server Component. Functionality is limited in this case, but it could be useful in some cases.

In this case, the action just receives form data as input.

In this example, we will use [zod-form-data](https://www.npmjs.com/package/zod-form-data) library as an "adapter" for Zod.

1. Define the action.

```tsx title=src/app/signup-action.ts
"use server";

import { action } from "@/lib/safe-action";
import { zfd } from "zod-form-data";

const schema = zfd.formData({
  email: zfd.text(),
  password: zfd.text(),
});

export const signup = action(schema, async ({ email, password }) => {
  console.log("Email:", email, "Password:", password);

  // Do something useful here.
});
```

2. Import it in a Server Component and use it as a form action.

```tsx title=src/app/signup/page.tsx
import { signup } from "./signup-action";

export default function SignUpPage() {
  return (
    <form action={signup}>
      <input type="text" name="email" placeholder="name@example.com" />
      <input type="password" name="password" placeholder="••••••••" />
      <button type="submit">Signup</button>
    </form>
  );
}
```

