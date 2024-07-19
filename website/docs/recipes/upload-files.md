---
sidebar_position: 8
description: Learn how to upload a file using next-safe-action.
---

# Upload files

Server Actions also allow you to upload files by using forms and inputs with type `file`.

:::note
If you exceed 1 MB in size, by default, Next.js throws an error on the server informing that the file is too big. You can customize the max size by using the [`bodySizeLimit`](https://nextjs.org/docs/app/api-reference/next-config-js/serverActions#bodysizelimit) option in `next.config.js`.
:::

Since you **must** use `FormData` to upload files, here we use the [`zod-form-data`](https://www.npmjs.com/package/zod-form-data) library to validate and parse the input.

```typescript title="file-upload-action.ts"
"use server";

import { action } from "@/lib/safe-action";
import { zfd } from "zod-form-data";

const schema = zfd.formData({
  image: zfd.file(),
});

export const fileUploadAction = action
  .schema(schema)
  .action(async ({ parsedInput }) => {
    await new Promise((res) => setTimeout(res, 1000));

    // Do something useful with the file.
    console.log("fileUploadAction ->", parsedInput);

    return {
      ok: true,
    };
  });
```

```tsx title="file-upload.tsx"
"use client";

import { useAction } from "next-safe-action/hooks";
import { fileUploadAction } from "./file-upload-action";

export default function FileUploadPage() {
  const { execute } = useAction(fileUploadAction);

  return (
    <form action={execute}>
      <input
        type="file"
        name="image"
        placeholder="Image"
        accept="image/*"
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```