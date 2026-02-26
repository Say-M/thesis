import { Schema, model, InferSchemaType, Types } from "mongoose";

const schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    tag: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    content: { type: Schema.Types.Mixed },
    seo: { type: Types.ObjectId, ref: "Seo" },
    status: { type: Boolean, default: true, index: true },
    showInHeader: { type: Boolean, default: false },
    showInFooter: { type: Boolean, default: false },
    showInMenu: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Page = model("Page", schema);
export type Page = InferSchemaType<typeof schema> & {
  _id: Types.ObjectId;
};
