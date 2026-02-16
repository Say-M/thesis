import { TwitterCard } from "../enums/seo";
import { z } from "zod";

export const createOrUpdateSeoSchema = z.object({
  metaTitle: z.string().trim().nullish(),
  metaDescription: z.string().trim().nullish(),
  metaKeywords: z.string().trim().nullish(),
  canonicalUrl: z.string().trim().nullish(),
  noindex: z.boolean().nullish(),
  nofollow: z.boolean().nullish(),
  ogTitle: z.string().trim().nullish(),
  ogDescription: z.string().trim().nullish(),
  ogImage: z.string().trim().nullish(),
  deleteOgImage: z.boolean().nullish(),
  ogType: z.string().trim().nullish(),
  twitterCard: z.enum(TwitterCard).nullish(),
  twitterTitle: z.string().trim().nullish(),
  twitterDescription: z.string().trim().nullish(),
  twitterImage: z.string().trim().nullish(),
  deleteTwitterImage: z.boolean().nullish(),
  structuredData: z.record(z.string(), z.any()).nullish(),
  type: z.enum(["category", "product", "page"]),
  id: z.string().trim(),
});

export type CreateOrUpdateSeoSchemaType = z.infer<
  typeof createOrUpdateSeoSchema
>;
