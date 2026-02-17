import { Schema, model, InferSchemaType, Types } from "mongoose";

const schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: Types.ObjectId,
      ref: "Asset",
      required: true,
    },
    link: {
      type: String,
      trim: true,
    },
    serial: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export const Banner = model("Banner", schema);
export type Banner = InferSchemaType<typeof schema> & {
  _id: Types.ObjectId;
};
