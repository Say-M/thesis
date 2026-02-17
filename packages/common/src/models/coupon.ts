import { Schema, model, InferSchemaType, Types } from "mongoose";
import { DiscountType } from "../enums/discount";

const schema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    description: { type: String, trim: true },
    discountType: {
      type: String,
      enum: DiscountType,
      required: true,
    },
    value: { type: Number, required: true, min: 0 },
    minPurchase: { type: Number, min: 0, default: 0 },
    maxDiscount: { type: Number, min: 0 },
    usageLimit: { type: Number, default: -1 },
    usedCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: -1 },
    freeShipping: { type: Boolean, default: false },
    validFrom: { type: Date, default: () => new Date() },
    validTo: { type: Date },
    status: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const Coupon = model("Coupon", schema);
export type Coupon = InferSchemaType<typeof schema> & {
  _id: Types.ObjectId;
};
