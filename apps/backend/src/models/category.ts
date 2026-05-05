import { Schema, model, InferSchemaType, Types } from "mongoose";

const schema = new Schema(
  {
    parentCategory: {
      type: Types.ObjectId,
      ref: "Category",
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
  },
  { timestamps: true },
);

export const Category = model("Category", schema);
export type Category = InferSchemaType<typeof schema> & {
  _id: Types.ObjectId;
};
