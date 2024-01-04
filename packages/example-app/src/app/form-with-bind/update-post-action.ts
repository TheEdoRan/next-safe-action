"use server";

import { action } from "@/lib/safe-action";
import { z } from "zod";
import { zfd } from "zod-form-data";

const schema = zfd.formData({
  title: zfd.text(),
  content: zfd.text(),
});

export const updatePost = action(
  z.string(),
  schema,
  async (postId, { content, title }) => {
    console.log(
      `Updating post ${postId} with title '${title}' and content '${content}'`
    );
    return {
      success: true,
    };
  }
);
