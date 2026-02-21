import { Schema, model, InferSchemaType, Types } from "mongoose";
import { DiscountType } from "../enums/discount";

type Variant = InferSchemaType<typeof variantSchema>;

const variantSchema = new Schema(
  {
    sku: { type: String, trim: true, sparse: true },
    name: { type: String, required: true, trim: true },
    images: { type: [Types.ObjectId], ref: "Asset" },
    buyingPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    discountType: {
      type: String,
      enum: DiscountType,
      default: DiscountType.PERCENTAGE,
    },
    discountValue: { type: Number, min: 0, default: 0 },
    weight: { type: Number, min: 0, default: 0 },
    weightUnit: { type: String, trim: true },
    unit: { type: String, trim: true },
    minQuantity: { type: Number, min: 1, default: 1 },
    maxQuantity: { type: Number, min: -1, default: -1 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true },
);

const schema = new Schema(
  {
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
    thumbnail: {
      type: Types.ObjectId,
      ref: "Asset",
    },
    images: {
      type: [Types.ObjectId],
      ref: "Asset",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: Schema.Types.Mixed,
    },
    videoLink: {
      type: String,
      trim: true,
    },
    seo: { type: Types.ObjectId, ref: "Seo" },
    hasVariants: {
      type: Boolean,
      default: false,
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
    weight: { type: Number, min: 0, default: 0 },
    weightUnit: { type: String, trim: true },
    unit: { type: String, trim: true },
    minQuantity: { type: Number, min: 1, default: 1 },
    maxQuantity: { type: Number, min: -1, default: -1 },
    stock: {
      type: Number,
      min: 0,
      default: 0,
      required: function (this: { hasVariants: boolean }) {
        return !this.hasVariants;
      },
    },
    sku: {
      type: String,
      trim: true,
      sparse: true,
    },
    variants: {
      type: [variantSchema],
      default: [],
      required: function (this: { hasVariants: boolean }) {
        return this.hasVariants;
      },
      validate: {
        validator: function (this: {
          hasVariants: boolean;
          variants: Variant[];
        }) {
          return !this.hasVariants || this.variants.length > 0;
        },
        message: "Variants are required when hasVariants is true",
      },
    },
    featured: {
      type: Boolean,
      default: false,
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
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

schema.virtual("totalStock").get(function (this: {
  hasVariants: boolean;
  stock: number;
  variants: { stock: number }[];
}) {
  if (this.hasVariants && Array.isArray(this.variants)) {
    return this.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
  }
  return this.stock ?? 0;
});

schema.set("toJSON", { virtuals: true });
schema.set("toObject", { virtuals: true });

export const Product = model("Product", schema);
export type Product = InferSchemaType<typeof schema> & {
  _id: Types.ObjectId;
  totalStock: number;
};
