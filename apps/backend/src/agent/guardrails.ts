export type GuardrailDecision =
  | { allow: true }
  | { allow: false; reason: string; userMessage: string };

export type GuardrailContext = {
  lastAssistantMessage?: string | null;
};

/**
 * Deterministic guardrail: only allow ecommerce-shopping intents supported by this platform.
 *
 * Allowed (examples):
 * - finding products / browsing categories
 * - comparing products
 * - summarizing reviews / deciding between suggested items
 * - skincare help that results in product recommendations (optionally with skin-analysis context)
 *
 * Block:
 * - general knowledge questions unrelated to shopping
 * - requests to do actions outside platform scope (coding, hacking, writing essays, etc.)
 */
export function guardUserInput(raw: string, ctx?: GuardrailContext): GuardrailDecision {
  const message = raw.trim();
  if (!message) return { allow: false, reason: "empty_message", userMessage: buildRefusal("empty_message") };

  const m = message.toLowerCase();

  // Context-aware allowance for short confirmations (prevents blocking multi-turn flows).
  // Example: Assistant asks "Would you like me to suggest ...?" and user replies "Yes".
  if (isShortConfirmation(m) && looksLikeQuestion(ctx?.lastAssistantMessage)) {
    return { allow: true };
  }

  // Hard blocks: clear out-of-scope / unsafe intent signals.
  const hardBlock = [
    /\b(hack|exploit|ddos|malware|phishing)\b/i,
    /\b(credit\s*card|cvv|ssn|password)\b/i,
    /\b(write\s+code|build\s+an\s+app|debug|stack\s*overflow|algorithm)\b/i,
    /\b(homework|assignment|thesis|research\s+paper)\b/i,
  ];
  if (hardBlock.some((r) => r.test(message))) {
    return { allow: false, reason: "out_of_scope", userMessage: buildRefusal("out_of_scope") };
  }

  // Soft allowlist: shopping intents and skincare-to-product intents.
  const allowSignals = [
    /\b(buy|purchase|price|budget|under\s*\$|discount|stock)\b/i,
    /\b(show|find|search|latest|new|recommend|suggest)\b/i,
    /\b(compare|vs|versus|difference|better)\b/i,
    /\b(review|rating|stars|feedback)\b/i,
    /\b(skincare|skin|acne|spots|wrinkles|oily|dry|normal|combination|serum|cleanser|moisturizer|sunscreen)\b/i,
    /\b(category|subcategory)\b/i,
  ];

  if (allowSignals.some((r) => r.test(message))) return { allow: true };

  // Default: block unknown/general queries to prevent becoming a general-purpose chatbot.
  return { allow: false, reason: "out_of_scope", userMessage: buildRefusal("out_of_scope") };
}

export function buildRefusal(reason: "out_of_scope" | "empty_message") {
  if (reason === "empty_message") return "Please type a message (or attach an image) so I can help you.";
  return [
    "I can only help with shopping tasks on this platform.",
    "You can ask me to search products, compare products, or summarize reviews.",
    "Example: “Suggest skincare for acne”, “Show latest skincare products”, “Compare product A vs B”.",
  ].join(" ");
}

function isShortConfirmation(m: string) {
  const normalized = m.replace(/[.!?]/g, "").trim();
  if (!normalized) return false;
  // keep tight to avoid turning into general chat
  const allowed = new Set([
    "yes",
    "y",
    "yeah",
    "yep",
    "ok",
    "okay",
    "sure",
    "go ahead",
    "continue",
    "please do",
    "do it",
    "no",
    "nope",
    "nah",
  ]);
  return normalized.length <= 20 && allowed.has(normalized);
}

function looksLikeQuestion(text?: string | null) {
  if (!text) return false;
  const t = text.trim().toLowerCase();
  if (!t) return false;
  if (t.includes("?")) return true;
  return (
    t.includes("would you like") ||
    t.includes("do you want") ||
    t.includes("should i") ||
    t.includes("can i") ||
    t.includes("shall i")
  );
}

