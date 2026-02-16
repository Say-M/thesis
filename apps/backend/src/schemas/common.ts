import { z } from "zod";

export const cursorPaginationQuerySchema = z.object({
  cursor: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;
