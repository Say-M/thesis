import { Hono } from "hono";
import { Types } from "mongoose";
import { Conversation } from "../models/conversation";
import { Message } from "../models/message";

export const conversationRoutes = new Hono();

conversationRoutes.get("/conversations", async (c) => {
  const { userId } = c.get("auth");

  const conversations = await Conversation.find({ userId })
    .sort({ updatedAt: -1 })
    .limit(100)
    .select({ _id: 1, title: 1, createdAt: 1, updatedAt: 1 })
    .lean();

  return c.json({
    conversations: conversations.map((x) => ({
      id: String(x._id),
      title: x.title || "New chat",
      createdAt: x.createdAt,
      updatedAt: x.updatedAt,
    })),
  });
});

conversationRoutes.get("/conversations/:id", async (c) => {
  const { userId } = c.get("auth");
  const id = c.req.param("id");
  if (!Types.ObjectId.isValid(id)) return c.json({ error: "invalid_conversation_id" }, 400);

  const conversation = await Conversation.findOne({ _id: new Types.ObjectId(id), userId })
    .select({ _id: 1, title: 1, createdAt: 1, updatedAt: 1 })
    .lean();
  if (!conversation) return c.json({ error: "not_found" }, 404);

  const messages = await Message.find({ conversationId: conversation._id, userId })
    .sort({ createdAt: 1 })
    .select({ _id: 1, role: 1, content: 1, toolName: 1, createdAt: 1 })
    .lean();

  const latestSkin = await Message.findOne({
    conversationId: conversation._id,
    userId,
    role: "tool",
    toolName: "skin_analysis",
  })
    .sort({ createdAt: -1 })
    .select({ toolResult: 1 })
    .lean();

  return c.json({
    conversation: {
      id: String(conversation._id),
      title: conversation.title || "New chat",
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    },
    messages: messages.map((m) => ({
      id: String(m._id),
      role: m.role,
      content: m.content,
      toolName: m.toolName,
      createdAt: m.createdAt,
    })),
    skinAnalysis: latestSkin?.toolResult ?? null,
  });
});

conversationRoutes.delete("/conversations/:id", async (c) => {
  const { userId } = c.get("auth");
  const id = c.req.param("id");
  if (!Types.ObjectId.isValid(id)) return c.json({ error: "invalid_conversation_id" }, 400);

  const conversationId = new Types.ObjectId(id);
  await Promise.all([
    Conversation.deleteOne({ _id: conversationId, userId }),
    Message.deleteMany({ conversationId, userId }),
  ]);

  return c.json({ ok: true });
});

