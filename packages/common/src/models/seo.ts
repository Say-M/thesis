import { Schema, model, InferSchemaType, Types } from "mongoose";
import { TwitterCard } from "../enums/seo";

const schema = new Schema(
  {
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    metaKeywords: { type: String, trim: true },
    canonicalUrl: { type: String, trim: true },
    noindex: { type: Boolean, default: false },
    nofollow: { type: Boolean, default: false },
    ogTitle: { type: String, trim: true },
    ogDescription: { type: String, trim: true },
    ogImage: { type: Types.ObjectId, ref: "Asset" },
    ogType: { type: String, trim: true },
    twitterCard: { type: String, enum: TwitterCard, trim: true },
    twitterTitle: { type: String, trim: true },
    twitterDescription: { type: String, trim: true },
    twitterImage: { type: Types.ObjectId, ref: "Asset" },
    structuredData: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export const Seo = model("Seo", schema);
export type Seo = InferSchemaType<typeof schema> & {
  _id: Types.ObjectId;
};
