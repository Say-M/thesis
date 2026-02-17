import { z } from "zod";
import { cursorPaginationQuerySchema } from "./common";

export const createCategorySchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .nonempty({ message: "Name is required" })
    .trim(),
  thumbnail: z.string().nullish(),
  description: z.string().trim().nullish(),
  parentCategory: z.string().trim().nullish(),
  seo: z.string().trim().nullish(),
  featured: z.boolean().nullish(),
  status: z.boolean().or(z.string().transform((val) => val === "true")),
});

export const updateCategorySchema = createCategorySchema
  .extend({
    isDeleteThumbnail: z
      .boolean()
      .or(z.string().transform((val) => val === "true"))
      .nullish(),
  })
  .partial();

export type CreateCategorySchemaType = z.infer<typeof createCategorySchema>;
export type UpdateCategorySchemaType = z.infer<typeof updateCategorySchema>;

export const listCategoryQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().trim().nullish(),
  parentCategories: z
    .string()
    .nullish()
    .transform((val) => val?.split(",").map((v) => v.trim())),
  status: z
    .string()
    .nullish()
    .transform((val) => val?.split(",").map((v) => v === "true")),
  featured: z
    .string()
    .nullish()
    .transform((val) =>
      val === "true" ? true : val === "false" ? false : undefined,
    ),
  type: z
    .string()
    .nullish()
    .transform((val) => val?.split(",").map((v) => v.trim())),
  all: z
    .string()
    .nullish()
    .transform((val) => val === "true"),
});

export type ListCategoryQuerySchemaType = z.infer<
  typeof listCategoryQuerySchema
>;
