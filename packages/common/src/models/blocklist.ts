import { Schema, model, InferSchemaType, Types } from "mongoose";

const schema = new Schema(
  {
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

export const Blocklist = model("Blocklist", schema);
export type Blocklist = InferSchemaType<typeof schema> & {
  _id: Types.ObjectId;
};
