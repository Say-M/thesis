import { z } from "zod";
import { cursorPaginationQuerySchema } from "./common";

export const pageSchema = z.object({
  title: z.string().nonempty().trim(),
  tag: z.string().trim(),
  slug: z
    .string()
    .trim()
    .transform((s) => s.toLowerCase()),
  content: z.any().nullish(),
  featuredImage: z.string().trim().nullish(),
  seo: z.string().trim().nullish(),
  status: z.boolean().nullish(),
  showInHeader: z.boolean().nullish(),
  showInFooter: z.boolean().nullish(),
  order: z.number().int().nullish().default(0),
});

export const updatePageSchema = pageSchema.partial();

export type PageSchemaType = z.infer<typeof pageSchema>;
export type UpdatePageSchemaType = z.infer<typeof updatePageSchema>;

export const listPageQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().trim().nullish(),
  status: z
    .string()
    .nullish()
    .transform((val) => val?.split(",").map((v) => v === "true")),
  showInHeader: z
    .string()
    .trim()
    .nullish()
    .transform((val) => val === "true"),
  showInFooter: z
    .string()
    .trim()
    .nullish()
    .transform((val) => val === "true"),
  all: z
    .string()
    .trim()
    .nullish()
    .transform((val) => val === "true"),
});

export type ListPageQuerySchemaType = z.infer<typeof listPageQuerySchema>;
