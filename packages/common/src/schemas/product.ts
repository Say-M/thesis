import { z } from "zod";
import { DiscountType } from "../enums/discount";
import { cursorPaginationQuerySchema } from "./common";

const variantSchema = z.object({
  status: z.boolean(),
  sku: z.string().trim().nullish(),
  name: z
    .string({ error: "Variant name is required" })
    .trim()
    .nonempty({ message: "Variant name is required" }),
  images: z.array(z.string().trim()).optional(),
  buyingPrice: z
    .number({ error: "Buying price is required" })
    .min(0, { message: "Buying price can not be negative" }),
  sellingPrice: z
    .number({ error: "Selling price is required" })
    .min(0, { message: "Selling price can not be negative" }),
  discountType: z.enum(DiscountType).nullish(),
  discountValue: z.number().min(0).nullish(),
  stock: z.number().int().min(0, { message: "Stock can not be negative" }),
});

const productSchema = z.object({
  category: z
    .string({ error: "Category is required" })
    .trim()
    .nonempty({ message: "Category is required" }),
  subcategory: z
    .string({ error: "Subcategory is required" })
    .trim()
    .nonempty({ message: "Subcategory is required" }),
  thumbnail: z.string().trim().nullish(),
  images: z.array(z.string().trim()).optional(),
  name: z
    .string({ error: "Name is required" })
    .nonempty({ error: "Name is required" })
    .trim(),
  slug: z
    .string({ error: "Slug is required" })
    .nonempty({ error: "Slug is required" })
    .trim()
    .transform((s) => s.toLowerCase()),
  description: z.string().trim().nullish(),
  videoLink: z.union([z.url(), z.literal("")]).nullish(),
  seo: z.string().trim().nullish(),
  hasVariants: z.boolean().nullish(),
  buyingPrice: z.coerce
    .number({ error: "Buying price is required" })
    .min(0, { message: "Buying price can not be negative" })
    .nullish(),
  sellingPrice: z.coerce
    .number({ error: "Selling price is required" })
    .min(0, { message: "Selling price can not be negative" })
    .nullish(),
  discountType: z.enum(DiscountType).nullish(),
  discountValue: z.coerce
    .number({ error: "Discount value is required" })
    .min(0, { message: "Discount can not be negative" })
    .nullish(),
  stock: z.coerce
    .number({ error: "Stock is required" })
    .int({ message: "Stock can not be a decimal number" })
    .min(0, { message: "Stock can not be negative" })
    .nullish(),
  sku: z.string().trim().nullish(),
  variants: z.array(variantSchema).nullish(),
  featured: z.boolean(),
  status: z.boolean(),
  faqs: z
    .array(
      z.object({
        question: z
          .string({ error: "Question is required" })
          .nonempty({ error: "Question is required" })
          .trim(),
        answer: z
          .string({ error: "Answer is required" })
          .nonempty({ error: "Answer is required" })
          .trim(),
      }),
    )
    .nullish(),
});

export const createProductSchema = productSchema.superRefine((data, ctx) => {
  if (data.hasVariants) {
    if (!data.variants?.length) {
      ctx.addIssue({
        code: "custom",
        message: "Variants required when has variants is true",
        path: ["variants"],
      });
    }
  }
  if (data.hasVariants === false) {
    if (!data.buyingPrice || !data.sellingPrice) {
      ctx.addIssue({
        code: "custom",
        message: "Buying price is required for single variant",
        path: ["buyingPrice"],
      });
      ctx.addIssue({
        code: "custom",
        message: "Selling price is required for single variant",
        path: ["sellingPrice"],
      });
    }
  }
});
export const updateProductSchema = productSchema
  .partial()
  .extend({
    isDeleteThumbnail: z.boolean().nullish(),
    deleteImages: z.array(z.string().trim()).nullish(),
    variants: z
      .array(
        variantSchema.extend({
          deleteImages: z.array(z.string().trim()).nullish(),
        }),
      )
      .nullish(),
  })
  .superRefine((data, ctx) => {
    if (data.hasVariants) {
      if (!data.variants?.length) {
        ctx.addIssue({
          code: "custom",
          message: "Variants required when has variants is true",
          path: ["variants"],
        });
      }
    }
    if (data.hasVariants === false) {
      if (!data.buyingPrice || !data.sellingPrice) {
        ctx.addIssue({
          code: "custom",
          message: "Buying price is required for single variant",
          path: ["buyingPrice"],
        });
        ctx.addIssue({
          code: "custom",
          message: "Selling price is required for single variant",
          path: ["sellingPrice"],
        });
      }
    }
  });

export type CreateProductSchemaType = z.infer<typeof createProductSchema>;
export type UpdateProductSchemaType = z.infer<typeof updateProductSchema>;

export const listProductQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().trim().nullish(),
  categories: z
    .string()
    .trim()
    .nullish()
    .transform((val) => val?.split(",").map((v) => v.trim())),
  subcategories: z
    .string()
    .trim()
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
  hasVariants: z
    .string()
    .nullish()
    .transform((val) => val?.split(",").map((v) => v === "true")),
  productIds: z
    .string()
    .trim()
    .nullish()
    .transform((val) => val?.split(",").map((v) => v.trim())),
});

export type ListProductQuerySchemaType = z.infer<typeof listProductQuerySchema>;
