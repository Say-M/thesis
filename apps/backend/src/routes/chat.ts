import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { Types } from "mongoose";
import { z } from "zod";
import { createExecutor, buildSystemPrompt } from "../agent/agent";
import { guardUserInput } from "../agent/guardrails";
import { Conversation } from "../models/conversation";
import { Message } from "../models/message";
import { ensureDbConnected } from "../db/ensure";
import {
  analyzeSkinFromImage,
  StoredSkinAnalysis,
} from "../services/skin-apis";

export const chatRoutes = new Hono();

const chatBodySchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(10_000),
  skinAnalysis: z.unknown().optional(), // still allowed for backward compatibility
});

chatRoutes.post("/chat", async (c) => {
  await ensureDbConnected();
  const { userId } = c.get("auth");

  const contentType = c.req.header("content-type") || "";

  let parsed:
    | {
        conversationId?: string;
        message: string;
        skinAnalysis?: unknown;
        file?: File;
      }
    | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await c.req.parseBody();
    const message =
      typeof form["message"] === "string" ? form["message"] : undefined;
    const conversationId =
      typeof form["conversationId"] === "string"
        ? form["conversationId"]
        : undefined;
    const file =
      form["file"] instanceof File ? (form["file"] as File) : undefined;
    if (!message)
      return c.json(
        {
          error: "invalid_body",
          hint: "multipart: message=<text>, optional file=<image>",
        },
        400,
      );
    parsed = { conversationId, message, file };
  } else {
    const body = chatBodySchema.safeParse(
      await c.req.json().catch(() => undefined),
    );
    if (!body.success)
      return c.json(
        { error: "invalid_body", details: body.error.flatten() },
        400,
      );
    parsed = body.data;
  }

  let lastAssistantMessage: string | null = null;
  if (parsed.conversationId && Types.ObjectId.isValid(parsed.conversationId)) {
    const last = await Message.findOne({
      conversationId: new Types.ObjectId(parsed.conversationId),
      userId,
      role: "assistant",
    })
      .sort({ createdAt: -1 })
      .select({ content: 1 })
      .lean();
    lastAssistantMessage = last?.content ?? null;
  }

  const guard = guardUserInput(parsed.message, { lastAssistantMessage });
  if (!guard.allow) {
    // Persist the user message for continuity, but refuse to run the agent.
    // We still create/load the conversation so chat history remains consistent.
    let conversationId: Types.ObjectId | undefined;
    if (parsed.conversationId) {
      if (!Types.ObjectId.isValid(parsed.conversationId)) {
        return c.json({ error: "invalid_conversation_id" }, 400);
      }
      conversationId = new Types.ObjectId(parsed.conversationId);
    }

    let conversation = conversationId
      ? await Conversation.findOne({ _id: conversationId, userId }).lean()
      : null;

    if (!conversation) {
      conversation = await Conversation.create({
        userId,
        title: parsed.message.slice(0, 80),
      });
      conversationId = conversation._id as unknown as Types.ObjectId;
    }

    await Message.create({
      conversationId,
      userId,
      role: "user",
      content: parsed.message,
    });

    const refusal = guard.userMessage;
    await Message.create({
      conversationId,
      userId,
      role: "assistant",
      content: refusal,
    });

    await Conversation.updateOne(
      { _id: conversationId, userId },
      { $set: { updatedAt: new Date() } },
    );

    return streamSSE(c, async (stream) => {
      await stream.writeSSE({
        event: "token",
        data: JSON.stringify({ delta: refusal }),
      });
      await stream.writeSSE({
        event: "metadata",
        data: JSON.stringify({ conversationId: String(conversationId) }),
      });
      await stream.writeSSE({ event: "done", data: "{}" });
    });
  }

  let conversationId: Types.ObjectId | undefined;
  if (parsed.conversationId) {
    if (!Types.ObjectId.isValid(parsed.conversationId)) {
      return c.json({ error: "invalid_conversation_id" }, 400);
    }
    conversationId = new Types.ObjectId(parsed.conversationId);
  }

  let conversation = conversationId
    ? await Conversation.findOne({ _id: conversationId, userId }).lean()
    : null;

  if (!conversation) {
    conversation = await Conversation.create({
      userId,
      title: parsed.message.slice(0, 80),
    });
    conversationId = conversation._id as unknown as Types.ObjectId;
  }

  await Message.create({
    conversationId,
    userId,
    role: "user",
    content: parsed.message,
  });

  // If an image is attached, run skin analysis now and persist it as a tool message.
  let inlineSkinAnalysis: StoredSkinAnalysis | undefined =
    parsed.skinAnalysis as StoredSkinAnalysis | undefined;
  if (parsed.file) {
    const bytes = new Uint8Array(await parsed.file.arrayBuffer());
    inlineSkinAnalysis = await analyzeSkinFromImage({
      filename: parsed.file.name || "face.jpg",
      bytes,
      contentType: parsed.file.type || "image/jpeg",
    });

    await Message.create({
      conversationId,
      userId,
      role: "tool",
      toolName: "skin_analysis",
      content: JSON.stringify({
        toolName: "skin_analysis",
        toolResult: inlineSkinAnalysis,
      }),
      toolResult: inlineSkinAnalysis,
    });
  }

  const historyDocs = await Message.find({ conversationId, userId })
    .sort({ createdAt: -1 })
    .limit(40)
    .select({ role: 1, content: 1, toolCallId: 1, toolName: 1, toolResult: 1 })
    .lean();

  const latestSkin = historyDocs.find(
    (m) => m.role === "tool" && m.toolName === "skin_analysis",
  );
  const skinSystemMessage =
    (inlineSkinAnalysis ?? latestSkin?.toolResult)
      ? {
          role: "system" as const,
          content:
            "Customer skin analysis (from uploaded face image). Use this to tailor skincare recommendations.\n" +
            JSON.stringify(inlineSkinAnalysis ?? latestSkin?.toolResult),
        }
      : null;

  const policy =
    inlineSkinAnalysis?.recommendation_policy ??
    latestSkin?.toolResult?.recommendation_policy;
  const yoloCount =
    inlineSkinAnalysis?.yolo_count ?? latestSkin?.toolResult?.yolo_count;
  const doctorPolicySystemMessage =
    policy === "doctor_consultation_suggested"
      ? {
          role: "system" as const,
          content:
            "Safety policy: The diagnosis indicates doctor consultation is suggested. In your response, explicitly tell the user to consult a dermatologist/doctor before using any suggested products. You may still provide gentle product suggestions, but consultation note must come first.",
        }
      : null;

  const noAcneSystemMessage =
    typeof yoloCount === "number" && yoloCount === 0
      ? {
          role: "system" as const,
          content:
            "Rule: yolo_count is 0, so no acne was detected. Do not recommend acne treatments or acne-specific products. Focus on general skincare for the user's skin type and any other non-acne concerns.",
        }
      : null;

  const chat_history = [
    { role: "system" as const, content: buildSystemPrompt() },
    ...(skinSystemMessage ? [skinSystemMessage] : []),
    ...(doctorPolicySystemMessage ? [doctorPolicySystemMessage] : []),
    ...(noAcneSystemMessage ? [noAcneSystemMessage] : []),
    ...historyDocs
      .reverse()
      .filter(
        (m) =>
          m.role === "user" || m.role === "assistant" || m.role === "system",
      )
      .map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
  ];

  const executor = await createExecutor();

  return streamSSE(
    c,
    async (stream) => {
      let assistantText = "";
      const toolMessages: Array<{
        role: "tool";
        toolName: string;
        toolCallId?: string;
        toolArgs?: unknown;
        toolResult?: unknown;
      }> = [];

      try {
        if (inlineSkinAnalysis) {
          await stream.writeSSE({
            event: "skin",
            data: JSON.stringify({ skinAnalysis: inlineSkinAnalysis }),
          });
        }

        const eventStream = executor.streamEvents(
          { input: parsed.message, chat_history },
          { version: "v1" },
        );

        for await (const ev of eventStream) {
          if (ev.event === "on_chat_model_stream") {
            const delta =
              (ev.data as any)?.chunk?.content ??
              (ev.data as any)?.chunk?.message?.content ??
              "";
            if (typeof delta === "string" && delta) {
              assistantText += delta;
              await stream.writeSSE({
                event: "token",
                data: JSON.stringify({ delta }),
              });
            }
          }

          if (ev.event === "on_tool_start") {
            toolMessages.push({
              role: "tool",
              toolName: ev.name,
              toolCallId: (ev.data as any)?.toolCallId,
              toolArgs: (ev.data as any)?.input,
              toolResult: undefined,
            });
          }

          if (ev.event === "on_tool_end") {
            const last = [...toolMessages]
              .reverse()
              .find(
                (t) => t.toolName === ev.name && t.toolResult === undefined,
              );
            if (last) last.toolResult = (ev.data as any)?.output;
          }

          if (ev.event === "on_chain_end" && ev.name === "AgentExecutor") {
            const output = (ev.data as any)?.output;
            if (!assistantText && typeof output === "string")
              assistantText = output;
          }
        }

        await Message.create({
          conversationId,
          userId,
          role: "assistant",
          content: assistantText || "(no output)",
        });

        if (toolMessages.length) {
          await Message.insertMany(
            toolMessages.map((t) => ({
              conversationId,
              userId,
              role: "tool",
              content: JSON.stringify({
                toolName: t.toolName,
                toolArgs: t.toolArgs,
                toolResult: t.toolResult,
              }),
              toolName: t.toolName,
              toolCallId: t.toolCallId,
              toolArgs: t.toolArgs,
              toolResult: t.toolResult,
            })),
          );
        }

        await Conversation.updateOne(
          { _id: conversationId, userId },
          { $set: { updatedAt: new Date() } },
        );

        await stream.writeSSE({
          event: "metadata",
          data: JSON.stringify({
            conversationId: String(conversationId),
            skinAnalysis: inlineSkinAnalysis ?? undefined,
          }),
        });
        await stream.writeSSE({ event: "done", data: "{}" });
      } catch (err) {
        await stream.writeSSE({
          event: "error",
          data: JSON.stringify({
            error: err instanceof Error ? err.message : "unknown_error",
          }),
        });
      }
    },
    async (err, stream) => {
      await stream.writeSSE({
        event: "error",
        data: JSON.stringify({
          error: err instanceof Error ? err.message : "unknown_error",
        }),
      });
    },
  );
});
