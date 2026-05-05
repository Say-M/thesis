import { Schema, model, InferSchemaType, Types } from "mongoose";
import { DiscountType } from "../enums/discount";

const schema = new Schema(
  {
    hasVariants: {
      type: Boolean,
      default: false,
    },
    category: {
      type: Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: {
      type: Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    buyingPrice: {
      type: Number,
      min: 0,
      required: function (this: { hasVariants: boolean }) {
        return !this.hasVariants;
      },
    },
    sellingPrice: {
      type: Number,
      min: 0,
      required: function (this: { hasVariants: boolean }) {
        return !this.hasVariants;
      },
    },
    discountType: {
      type: String,
      enum: DiscountType,
      default: DiscountType.PERCENTAGE,
    },
    discountValue: { type: Number, min: 0, default: 0 },
    stock: {
      type: Number,
      min: 0,
      default: 0,
      required: function (this: { hasVariants: boolean }) {
        return !this.hasVariants;
      },
    },
    status: {
      type: Boolean,
      default: true,
    },
    faqs: [
      {
        question: {
          type: String,
          required: true,
          trim: true,
        },
        answer: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
  },
  { timestamps: true },
);

export const Product = model("Product", schema);
export type Product = InferSchemaType<typeof schema> & {
  _id: Types.ObjectId;
  totalStock: number;
};
