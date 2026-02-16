import { Schema, model, InferSchemaType, Types } from "mongoose";

const schema = new Schema(
  {
    thumbnail: {
      type: Types.ObjectId,
      ref: "Asset",
    },
    parentCategory: {
      type: Types.ObjectId,
      ref: "Category",
    },
    seo: {
      type: Types.ObjectId,
      ref: "Seo",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const Category = model("Category", schema);
export type Category = InferSchemaType<typeof schema> & {
  _id: Types.ObjectId;
};
