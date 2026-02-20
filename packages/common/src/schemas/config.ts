import { z } from "zod";
import { createOrUpdateSeoSchema } from "./seo";

const socialEntrySchema = z.object({
  name: z.string().trim(),
  url: z.string().trim().optional(),
});

const shippingSchema = z.object({
  name: z.string().trim(),
  price: z.number().min(0),
});

export const updateConfigSchema = z.object({
  currency: z.string().trim().max(10).nullish(),
  taxAmount: z.number().min(0).nullish(),
  shippingCharges: z.array(shippingSchema).nullish(),
  codAmount: z.number().min(0).max(100).nullish(),
  siteName: z.string().trim().nullish(),
  siteDescription: z.string().trim().nullish(),
  siteLogo: z.string().trim().nullish(),
  siteFavicon: z.string().trim().nullish(),
  siteEmail: z.string().trim().nullish(),
  sitePhone: z.string().trim().nullish(),
  siteAddress: z.string().trim().nullish(),
  siteUrl: z.string().trim().nullish(),
  socials: z.record(z.string(), socialEntrySchema).nullish(),
  seo: createOrUpdateSeoSchema.omit({ type: true, id: true }).nullish(),
});

export type UpdateConfigSchemaType = z.infer<typeof updateConfigSchema>;
