import { Schema, model, InferSchemaType, Types } from "mongoose";

const schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, trim: true },
  },
  { timestamps: true },
);

schema.index({ userId: 1, updatedAt: -1 });

export const Conversation = model("Conversation", schema);
export type Conversation = InferSchemaType<typeof schema> & { _id: Types.ObjectId };

