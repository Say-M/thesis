import { Schema, model, InferSchemaType, Types } from "mongoose";
import { ReviewStatus } from "../enums/review";

const schema = new Schema(
  {
    product: {
      type: Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ReviewStatus,
      default: ReviewStatus.PENDING,
    },
  },
  { timestamps: true },
);

export const Review = model("Review", schema);
export type Review = InferSchemaType<typeof schema> & {
  _id: Types.ObjectId;
};
