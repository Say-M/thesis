import { z } from "zod";
import { cursorPaginationQuerySchema } from "./common";

export const createBannerSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .nonempty({ message: "Title is required" })
    .trim(),
  description: z.string().trim().nullish(),
  image: z
    .string({ error: "Image is required" })
    .nonempty({ message: "Image is required" })
    .trim(),
  link: z.union([z.url(), z.literal("")]).nullish(),
  serial: z
    .number({ error: "Serial is required" })
    .int()
    .positive({ message: "Serial is required" }),
  status: z.boolean(),
});

export const updateBannerSchema = createBannerSchema.partial();

export type CreateBannerSchemaType = z.infer<typeof createBannerSchema>;
export type UpdateBannerSchemaType = z.infer<typeof updateBannerSchema>;

export const listBannerQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().trim().nullish(),
  status: z
    .string()
    .trim()
    .nullish()
    .transform((val) => val?.split(",").map((v) => v === "true")),
  all: z
    .string()
    .trim()
    .nullish()
    .transform((val) => val === "true"),
});

export type ListBannerQuerySchemaType = z.infer<typeof listBannerQuerySchema>;
