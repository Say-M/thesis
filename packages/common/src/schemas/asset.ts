import { z } from "zod";
import { AssetProvider } from "../models/asset";
import { cursorPaginationQuerySchema } from "./common";
import { acceptedImageMimeTypes } from "../constants/image";

const parseJsonArray = (val: unknown): unknown => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

export const createAssetSchema = z.object({
  file: z
    .file()
    .refine(
      (file) => (file ? acceptedImageMimeTypes.includes(file.type) : true),
      { message: "Invalid image file" },
    ),
  name: z.string().trim().optional(),
  tags: z.preprocess(parseJsonArray, z.array(z.string().trim()).optional()),
});

export type CreateAssetSchemaType = z.infer<typeof createAssetSchema>;

export const updateAssetSchema = createAssetSchema
  .omit({ file: true })
  .partial();
export type UpdateAssetSchemaType = z.infer<typeof updateAssetSchema>;

export const createBulkAssetSchema = z.object({
  files: z
    .array(z.file())
    .refine(
      (files) =>
        files
          ? files.every((file) => acceptedImageMimeTypes.includes(file.type))
          : true,
      { message: "Invalid image files" },
    )
    .min(1, { message: "At least one file is required" }),
});

export type CreateBulkAssetSchemaType = z.infer<typeof createBulkAssetSchema>;

export const listAssetQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().trim().optional(),
  provider: z.enum(AssetProvider).optional(),
});

export type ListAssetQuerySchemaType = z.infer<typeof listAssetQuerySchema>;
