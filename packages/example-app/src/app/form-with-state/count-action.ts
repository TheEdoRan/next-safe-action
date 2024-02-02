"use server";

import { action } from "@/lib/safe-action";
import z from "zod";
import { zfd } from "zod-form-data";

const schema = zfd.formData({
  step: zfd.numeric(z.number().min(0)),
});

const stateSchema = z.object({ data: z.number().optional() });

export const count = action(stateSchema, schema, async (state, { step }) => {
  return (state.data ?? 0) + step;
});
