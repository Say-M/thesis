import { ChatOpenAI } from "@langchain/openai";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { HumanMessage, AIMessage, ToolMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { z } from "zod";
import { productCompare, productSearch, reviewSummary } from "../services/product-tools";

export type AgentRunInput = {
  userMessage: string;
  chatHistory: Array<{ role: "user" | "assistant" | "system"; content: string }>;
};

export type AgentRunOutput = {
  text: string;
  suggestedProducts?: string[];
};

const productSearchTool = new DynamicStructuredTool({
  name: "product_search",
  description:
    "Search skincare products by keywords and filters. Prefer the `keywords` array and pass MANY related synonyms/expansions of the user's need so recall is high. " +
    "Every keyword is OR-matched against product name and description. " +
    "Examples: for oily skin pass [\"oily\",\"oil control\",\"oil-free\",\"sebum\",\"mattifying\",\"matte\",\"gel\"]; " +
    "for acne pass [\"acne\",\"blemish\",\"salicylic\",\"benzoyl\",\"spot\",\"breakout\",\"BHA\"]; " +
    "for dry skin pass [\"dry\",\"hydrating\",\"moisturizing\",\"hyaluronic\",\"ceramide\",\"barrier\"]. " +
    "Use categoryName/subcategoryName for browsing, minPrice/maxPrice for budget, and latest for newest products.",
  schema: z.object({
    query: z.string().optional(),
    keywords: z
      .array(z.string())
      .optional()
      .describe(
        "Many related keywords/synonyms expanding the user's need. Prefer this over `query`.",
      ),
    categoryName: z.string().optional(),
    subcategoryName: z.string().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    latest: z.boolean().optional(),
    limit: z.number().optional(),
  }),
  func: async (input) => {
    const res = await productSearch(input);
    return JSON.stringify(res);
  },
});

const productCompareTool = new DynamicStructuredTool({
  name: "product_compare",
  description:
    "Compare 2-5 products by slug or id. Use when the user asks to compare or pick the best for a purpose (e.g., gaming phone).",
  schema: z.object({
    slugsOrIds: z.array(z.string()).min(2).max(5),
  }),
  func: async (input) => {
    const res = await productCompare(input);
    return JSON.stringify(res);
  },
});

const reviewSummaryTool = new DynamicStructuredTool({
  name: "review_summary",
  description:
    "Summarize approved reviews for a product (by slug or id). Use for 'what do reviews say?' and to choose among suggested items.",
  schema: z.object({
    productSlugOrId: z.string().min(1),
    limit: z.number().optional(),
  }),
  func: async (input) => {
    const res = await reviewSummary(input);
    return JSON.stringify(res);
  },
});

export const agentTools = [productSearchTool, productCompareTool, reviewSummaryTool] as const;

export async function createExecutor() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not defined");

  const model = new ChatOpenAI({
    apiKey,
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    temperature: 0.2,
  });

  const agent = await createToolCallingAgent({
    llm: model,
    tools: [...agentTools],
    prompt: ChatPromptTemplate.fromMessages([
      ["system", buildSystemPrompt()],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad"),
    ]),
  });

  return new AgentExecutor({
    agent,
    tools: [...agentTools],
    verbose: false,
  });
}

export function buildSystemPrompt() {
  return [
    "You are an ecommerce shopping assistant for a skincare catalog.",
    "You can search products, compare products, and summarize reviews using tools.",
    "Stay strictly within this platform scope: shopping help only (product discovery, comparison, and review-based guidance).",
    "If the user asks for anything outside this scope, politely refuse and redirect them to shopping-related requests.",
    "When searching, ALWAYS use product_search with a rich `keywords` array: expand the user's need into many related terms and synonyms so you find all relevant products.",
    "For example, 'oily skin' -> ['oily','oil control','oil-free','sebum','mattifying','matte','gel']; 'acne' -> ['acne','blemish','breakout','spot','salicylic','BHA','benzoyl']; 'dry' -> ['dry','hydrating','moisturizing','hyaluronic','ceramide','barrier']; 'anti-aging' -> ['wrinkle','anti-aging','retinol','firming','collagen'].",
    "Map skin type/condition/severity from any provided diagnosis into keywords too.",
    "If a search returns no products, retry with a broader keyword set or drop the query and browse by category before telling the user nothing was found.",
    "When you recommend products, be concise and include product slugs/ids when available.",
    "If you need more info (budget, skin type), ask 1-2 clarifying questions.",
    "Do not invent products; use tools when you need product data.",
  ].join("\n");
}

export async function runAgent(input: AgentRunInput): Promise<AgentRunOutput> {
  const executor = await createExecutor();

  const chat_history: Array<SystemMessage | HumanMessage | AIMessage> = [];
  for (const m of input.chatHistory) {
    if (m.role === "system") chat_history.push(new SystemMessage(m.content));
    if (m.role === "user") chat_history.push(new HumanMessage(m.content));
    if (m.role === "assistant") chat_history.push(new AIMessage(m.content));
  }

  const result = await executor.invoke({ input: input.userMessage, chat_history });
  const text = typeof result.output === "string" ? result.output : JSON.stringify(result.output);
  return { text };
}

export function toLangChainMessages(
  history: Array<{ role: "user" | "assistant" | "system" | "tool"; content: string; toolCallId?: string }>,
) {
  return history.map((m) => {
    switch (m.role) {
      case "system":
        return new SystemMessage(m.content);
      case "user":
        return new HumanMessage(m.content);
      case "assistant":
        return new AIMessage(m.content);
      case "tool":
        return new ToolMessage({ content: m.content, tool_call_id: m.toolCallId || "tool" });
    }
  });
}

