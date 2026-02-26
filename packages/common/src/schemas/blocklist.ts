import { z } from "zod";
import { cursorPaginationQuerySchema } from "./common";

export const createBlocklistSchema = z.object({
  mobile: z.string().trim().nonempty({ message: "Mobile number is required" }),
  reason: z.string().trim().nullish(),
});

export const updateBlocklistSchema = createBlocklistSchema.partial();

export type CreateBlocklistSchemaType = z.infer<typeof createBlocklistSchema>;
export type UpdateBlocklistSchemaType = z.infer<typeof updateBlocklistSchema>;

export const listBlocklistQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().nullish(),
});

export type ListBlocklistQuerySchemaType = z.infer<
  typeof listBlocklistQuerySchema
>;
