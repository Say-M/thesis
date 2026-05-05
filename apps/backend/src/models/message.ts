import { Schema, model, InferSchemaType, Types } from "mongoose";

export const MessageRole = ["system", "user", "assistant", "tool"] as const;
export type MessageRole = (typeof MessageRole)[number];

const schema = new Schema(
  {
    conversationId: { type: Types.ObjectId, ref: "Conversation", required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, enum: MessageRole, required: true },
    content: { type: String, required: true },

    toolName: { type: String, trim: true },
    toolCallId: { type: String, trim: true },
    toolArgs: { type: Schema.Types.Mixed },
    toolResult: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

schema.index({ conversationId: 1, createdAt: 1 });

export const Message = model("Message", schema);
export type Message = InferSchemaType<typeof schema> & { _id: Types.ObjectId };

