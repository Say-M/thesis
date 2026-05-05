import { Hono } from "hono";
import { Types } from "mongoose";
import { z } from "zod";
import { analyzeSkinFromImage } from "../services/skin-apis";
import { Conversation } from "../models/conversation";
import { Message } from "../models/message";

export const skinRoutes = new Hono();

skinRoutes.post("/skin/analyze", async (c) => {
  const { userId } = c.get("auth");

  const body = await c.req.parseBody();
  const file = body["file"];
  const conversationIdRaw = body["conversationId"];

  if (!(file instanceof File)) {
    return c.json({ error: "missing_file", hint: "multipart form-data: file=<image>" }, 400);
  }

  const conversationIdParsed = z.string().optional().safeParse(
    typeof conversationIdRaw === "string" ? conversationIdRaw : undefined,
  );
  if (!conversationIdParsed.success) return c.json({ error: "invalid_conversation_id" }, 400);

  let conversationId: Types.ObjectId | undefined;
  if (conversationIdParsed.data) {
    if (!Types.ObjectId.isValid(conversationIdParsed.data)) {
      return c.json({ error: "invalid_conversation_id" }, 400);
    }
    conversationId = new Types.ObjectId(conversationIdParsed.data);
  }

  let conversation = conversationId
    ? await Conversation.findOne({ _id: conversationId, userId }).lean()
    : null;

  if (!conversation) {
    conversation = await Conversation.create({
      userId,
      title: "Skin analysis",
    });
    conversationId = conversation._id as unknown as Types.ObjectId;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const analysis = await analyzeSkinFromImage({
    filename: file.name || "face.jpg",
    bytes,
    contentType: file.type || "image/jpeg",
  });

  await Message.create({
    conversationId,
    userId,
    role: "tool",
    toolName: "skin_analysis",
    content: JSON.stringify({ toolName: "skin_analysis", toolResult: analysis }),
    toolResult: analysis,
  });

  await Conversation.updateOne({ _id: conversationId, userId }, { $set: { updatedAt: new Date() } });

  return c.json({
    ok: true,
    conversationId: String(conversationId),
    analysis,
    summary: summarize(analysis),
  });
});

function summarize(a: any) {
  const condition = a?.condition?.result?.condition;
  const conditionConf = a?.condition?.result?.confidence;
  const skinType = a?.skinType?.result?.skin_type;
  const skinTypeConf = a?.skinType?.result?.confidence;
  const severity = a?.acneSeverity?.severity;
  const severityConf = a?.acneSeverity?.confidence;

  return {
    condition,
    conditionConfidence: conditionConf,
    skinType,
    skinTypeConfidence: skinTypeConf,
    acneSeverity: severity,
    acneSeverityConfidence: severityConf,
  };
}

