import { Schema, model, InferSchemaType, Types } from "mongoose";
import { schema as seoSchema } from "./seo";

const shippingSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const schema = new Schema(
  {
    currency: {
      type: String,
      trim: true,
      default: "BDT",
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    shippingCharges: {
      type: [shippingSchema],
      default: [],
    },
    codAmount: {
      type: Number,
      default: 0,
    },
    siteName: {
      type: String,
      trim: true,
      default: "My Store",
    },
    siteDescription: {
      type: String,
      trim: true,
    },
    siteLogo: {
      type: Types.ObjectId,
      ref: "Asset",
    },
    siteFavicon: {
      type: Types.ObjectId,
      ref: "Asset",
    },
    siteEmail: {
      type: String,
      trim: true,
    },
    sitePhone: {
      type: String,
      trim: true,
    },
    siteAddress: {
      type: String,
      trim: true,
    },
    siteUrl: {
      type: String,
      trim: true,
    },
    socials: {
      type: Map,
      of: new Schema(
        {
          name: { type: String, trim: true },
          url: { type: String, trim: true },
        },
        { _id: false },
      ),
    },
    seo: {
      type: seoSchema,
    },
  },
  { timestamps: true },
);

export const Config = model("Config", schema);
export type Config = InferSchemaType<typeof schema> & {
  _id: Types.ObjectId;
};
