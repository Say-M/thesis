"use client";

import * as React from "react";
import { toast } from "sonner";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import * as faceapi from "face-api.js";
import { BACKEND_URL } from "@/lib/backend";
import { parseSSE } from "@/lib/sse";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ConversationListItem = {
  id: string;
  title: string;
  updatedAt: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [conversations, setConversations] = React.useState<
    ConversationListItem[]
  >([]);
  const [conversationId, setConversationId] = React.useState<string | null>(
    null,
  );
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(
    null,
  );
  const [skinSummary, setSkinSummary] = React.useState<Record<string, unknown> | null>(
    null,
  );
  const abortRef = React.useRef<AbortController | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const faceModelsLoadedRef = React.useRef(false);
  const faceModelsLoadingRef = React.useRef<Promise<void> | null>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();
  const lastTranscriptRef = React.useRef("");

  React.useEffect(() => {
    if (!listening) return;
    if (!transcript) return;

    // Append only the delta since last render while listening.
    const prev = lastTranscriptRef.current;
    const delta = transcript.startsWith(prev)
      ? transcript.slice(prev.length)
      : transcript;
    if (delta.trim()) setInput((x) => (x ? `${x}${delta}` : delta));
    lastTranscriptRef.current = transcript;
  }, [transcript, listening]);

  React.useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  async function ensureFaceModelsLoaded() {
    if (faceModelsLoadedRef.current) return;
    if (faceModelsLoadingRef.current) return faceModelsLoadingRef.current;

    faceModelsLoadingRef.current = (async () => {
      // Prefer local models at /models (recommended for production),
      // but fall back to CDN so the feature works out-of-the-box.
      const localUri = "/models";
      const cdnUri =
        "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(localUri);
        faceModelsLoadedRef.current = true;
        return;
      } catch {
        // ignore and try CDN
      }

      await faceapi.nets.tinyFaceDetector.loadFromUri(cdnUri);
      faceModelsLoadedRef.current = true;
    })();

    return faceModelsLoadingRef.current;
  }

  async function cropFaceFromImage(file: File): Promise<File | null> {
    await ensureFaceModelsLoaded();

    const img = await fileToHtmlImage(file);
    const detections = await faceapi.detectAllFaces(
      img,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5,
      }),
    );

    if (!detections.length) return null;

    // Use the biggest detected face.
    const best = detections.reduce((a, b) => {
      const areaA = a.box.width * a.box.height;
      const areaB = b.box.width * b.box.height;
      return areaB > areaA ? b : a;
    });

    // Add a margin to include some surrounding context.
    const margin = 0.25;
    const x = Math.max(0, best.box.x - best.box.width * margin);
    const y = Math.max(0, best.box.y - best.box.height * margin);
    const w = Math.min(img.width - x, best.box.width * (1 + margin * 2));
    const h = Math.min(img.height - y, best.box.height * (1 + margin * 2));

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(w));
    canvas.height = Math.max(1, Math.floor(h));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(img, x, y, w, h, 0, 0, canvas.width, canvas.height);

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.92);
    });

    return new File([blob], `face_${file.name || "upload"}`.replace(/\s+/g, "_"), {
      type: "image/jpeg",
    });
  }

  async function loadConversations() {
    const res = await fetch(`${BACKEND_URL}/api/conversations`, {
      credentials: "include",
      headers: {
        "x-user-id": "user_id",
      },
    });
    if (!res.ok) throw new Error(await res.text());
    const json = (await res.json()) as {
      conversations: ConversationListItem[];
    };
    setConversations(json.conversations);
  }

  async function openConversation(id: string) {
    const res = await fetch(`${BACKEND_URL}/api/conversations/${id}`, {
      credentials: "include",
      headers: {
        "x-user-id": "user_id",
      },
    });
    if (!res.ok) throw new Error(await res.text());
    const json = (await res.json()) as {
      messages: Array<{ id: string; role: string; content: string }>;
      skinAnalysis?: unknown;
    };
    setConversationId(id);
    setMessages(
      json.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
    );
    if (json.skinAnalysis) setSkinSummary(summarizeSkin(json.skinAnalysis));
  }

  React.useEffect(() => {
    queueMicrotask(() => {
      loadConversations().catch((e) => toast.error(String(e)));
    });
  }, []);

  async function sendMessage() {
    const text = input.trim();
    if ((!text && !imageFile) || isStreaming) return;
    setInput("");
    resetTranscript();
    lastTranscriptRef.current = "";

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    try {
      const form = new FormData();
      form.append("message", text || "Analyze my skin and recommend products.");
      if (conversationId) form.append("conversationId", conversationId);
      if (imageFile) form.append("file", imageFile);

      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "x-user-id": "user_id" },
        body: form,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(await res.text());
      if (!res.body) throw new Error("No response body");

      for await (const ev of parseSSE(res.body)) {
        if (ev.event === "skin") {
          const payload = JSON.parse(ev.data) as { skinAnalysis?: unknown };
          if (payload.skinAnalysis) setSkinSummary(summarizeSkin(payload.skinAnalysis));
        }
        if (ev.event === "token") {
          const payload = JSON.parse(ev.data) as { delta: string };
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: m.content + payload.delta }
                : m,
            ),
          );
        }
        if (ev.event === "metadata") {
          const payload = JSON.parse(ev.data) as {
            conversationId: string;
            skinAnalysis?: unknown;
          };
          if (payload.conversationId) setConversationId(payload.conversationId);
          if (payload.skinAnalysis) setSkinSummary(summarizeSkin(payload.skinAnalysis));
          loadConversations().catch(() => {});
        }
        if (ev.event === "error") {
          const payload = JSON.parse(ev.data) as { error: string };
          toast.error(payload.error || "Agent error");
        }
        if (ev.event === "done") break;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error(String(e));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      setImageFile(null);
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  async function toggleMic() {
    if (!browserSupportsSpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (listening) {
      SpeechRecognition.stopListening();
      return;
    }

    resetTranscript();
    lastTranscriptRef.current = "";
    try {
      await SpeechRecognition.startListening({
        continuous: true,
        language: "en-US",
      });
    } catch (e) {
      toast.error(`Could not start mic: ${String(e)}`);
    }
  }

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="w-72 border-r bg-white dark:bg-black">
        <div className="p-3 flex items-center justify-between">
          <div className="text-sm font-semibold">Chats</div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setConversationId(null);
              setMessages([]);
              setSkinSummary(null);
            }}
          >
            New
          </Button>
        </div>
        <Separator />
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-2 space-y-1">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() =>
                  openConversation(c.id).catch((e) => toast.error(String(e)))
                }
                className={cn(
                  "w-full text-left rounded-md px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900",
                  conversationId === c.id && "bg-zinc-100 dark:bg-zinc-900",
                )}
              >
                <div className="font-medium line-clamp-1">{c.title}</div>
                <div className="text-xs text-zinc-500 line-clamp-1">
                  {new Date(c.updatedAt).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      <main className="flex flex-1 min-w-0 flex-col">
        <ScrollArea className="flex-1">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-4">
            {skinSummary ? (
              <div className="rounded-xl border bg-white dark:bg-black px-4 py-3 text-sm">
                <div className="font-medium mb-1">Skin analysis (from image)</div>
                <pre className="text-xs overflow-auto whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
                  {JSON.stringify(skinSummary, null, 2)}
                </pre>
              </div>
            ) : null}
            {messages.length === 0 ? (
              <div className="text-sm text-zinc-500">
                Ask things like “I have mild acne, suggest me something” or
                “Compare iPhone 12 and Pixel 6”.
              </div>
            ) : null}
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap",
                  m.role === "user"
                    ? "ml-auto max-w-[85%] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black"
                    : "mr-auto max-w-[85%] bg-zinc-100 text-black dark:bg-zinc-900 dark:text-zinc-50",
                )}
              >
                {m.content ||
                  (m.role === "assistant" && isStreaming ? "…" : "")}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t bg-white dark:bg-black">
          <div className="mx-auto w-full max-w-3xl px-4 py-4 flex gap-2 items-end">
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                disabled={isStreaming}
                onChange={async (e) => {
                  const f = e.target.files?.[0] || null;
                  if (!f) {
                    setImageFile(null);
                    return;
                  }

                  try {
                    toast.message("Detecting face and cropping…");
                    const cropped = await cropFaceFromImage(f);
                    if (!cropped) {
                      alert("No face detected in the uploaded image. Please upload a clear face image.");
                      setImageFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      return;
                    }
                    setImageFile(cropped);
                    toast.message(`Face cropped: ${cropped.name}`);
                  } catch (err) {
                    toast.error(`Face processing failed: ${err instanceof Error ? err.message : String(err)}`);
                    setImageFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }
                }}
              />
              {imageFile ? (
                <div className="text-xs text-zinc-500">Selected: {imageFile.name}</div>
              ) : null}
              {imagePreviewUrl ? (
                <div className="flex items-center gap-2">
                  <img
                    src={imagePreviewUrl}
                    alt="Cropped face preview"
                    className="h-16 w-16 rounded-md border object-cover"
                  />
                  <div className="text-xs text-zinc-500">Preview (cropped)</div>
                </div>
              ) : null}
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                listening ? "Listening… speak now" : "Type your message…"
              }
              className="min-h-12"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isStreaming}
            />
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant={listening ? "secondary" : "outline"}
                onClick={toggleMic}
                disabled={isStreaming}
              >
                {listening ? "Stop mic" : "Mic"}
              </Button>
              <Button
                onClick={sendMessage}
                disabled={isStreaming || (!input.trim() && !imageFile)}
              >
                Send
              </Button>
              <Button
                variant="secondary"
                onClick={stop}
                disabled={!isStreaming}
              >
                Stop
              </Button>
            </div>
          </div>
          <div className="mx-auto w-full max-w-3xl px-4 pb-3 text-xs text-zinc-500">
            Uses your session cookie for chat history. Configure
            `NEXT_PUBLIC_BACKEND_URL` to point at the Hono backend.
          </div>
        </div>
      </main>
    </div>
  );
}

function summarizeSkin(a: unknown): Record<string, unknown> {
  const x = a as any;
  return {
    type: x?.type,
    condition: x?.condition,
    severity: x?.severity,
    recommendationPolicy: x?.recommendation_policy,
    yoloCount: x?.yolo_count,
    confidence: x?.confidence,
    probs: x?.probs,
  };
}

async function fileToHtmlImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
