import { z } from "zod";
import { ContentfulStatusCode } from "hono/utils/http-status";

export const responseSchema = z.object({
  status: z.number(),
  message: z.string(),
  timestamp: z.iso.datetime(),
  error: z.any().optional(),
  data: z.record(z.string(), z.any()).optional(),
  pagination: z
    .object({
      limit: z.number().optional(),
      nextCursor: z.string().optional(),
      hasMore: z.boolean(),
    })
    .optional(),
});

export type ResponseType = z.infer<typeof responseSchema> & {
  status: ContentfulStatusCode;
};
