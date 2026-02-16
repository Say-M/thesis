import { z } from "zod";
import { DiscountType } from "../enums/discount";
import { cursorPaginationQuerySchema } from "./common";

export const createCouponSchema = z.object({
  code: z
    .string()
    .nonempty()
    .trim()
    .transform((s) => s.toUpperCase()),
  description: z.string().trim().nullish(),
  discountType: z.enum(DiscountType),
  value: z.number().int().min(0),
  minPurchase: z.number().int().min(0).nullish(),
  maxDiscount: z.number().int().min(0).nullish(),
  usageLimit: z.number().int().nullish(),
  perUserLimit: z.number().int().nullish(),
  freeShipping: z.boolean().nullish(),
  validFrom: z.iso.datetime(),
  validTo: z.iso.datetime().nullish(),
  status: z.boolean().nullish(),
});

export const updateCouponSchema = createCouponSchema.partial();

export type CreateCouponSchemaType = z.infer<typeof createCouponSchema>;
export type UpdateCouponSchemaType = z.infer<typeof updateCouponSchema>;

export const listCouponQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().trim().nullish(),
  discountType: z.enum(DiscountType).nullish(),
  validFrom: z.iso.datetime().nullish(),
  validTo: z.iso.datetime().nullish(),
  status: z
    .string()
    .nullish()
    .transform((val) => val?.split(",").map((v) => v === "true")),
});

export type ListCouponQuerySchemaType = z.infer<typeof listCouponQuerySchema>;

export const getCouponByCodeBodySchema = z.object({
  cartTotal: z.number().int().min(0).nullish(),
});
