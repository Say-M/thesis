import { Schema, model, InferSchemaType, Types } from "mongoose";

export enum AssetProvider {
  LOCAL = "local",
  S3 = "s3",
  CLOUDINARY = "cloudinary",
  IMAGEKIT = "imagekit",
}

const schema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    mimetype: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
    },
    tags: {
      type: [String],
      trim: true,
      required: false,
    },
    provider: {
      type: String,
      required: true,
      enum: AssetProvider,
    },
    providedId: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

export const Asset = model("Asset", schema);
export type Asset = InferSchemaType<typeof schema> & {
  _id: Types.ObjectId;
};
