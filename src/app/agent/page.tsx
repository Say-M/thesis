"use client";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import { Button } from "@/components/ui/button";
import { useAgent } from "@/context/agent-context";
import { Navigation } from "@/components/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AgentPage() {
  return (
    <>
      <Navigation />
      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <Header />
        <ChatSurface />
        <QuickPrompts />
      </div>
    </>
  );
}

function Header() {
  return (
    <header className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-tight text-primary">
        AI Shopping Assistant
      </p>
      <h1 className="text-3xl font-semibold">
        Commerce copilot for modern storefronts
      </h1>
      <p className="text-muted-foreground">
        Chat with our AI assistant to find products, compare items, get review
        summaries, track orders, and add items directly to your cart.
      </p>
    </header>
  );
}

function ChatSurface() {
  const { messages, sendMessage } = useAgent();

  return (
    <section className="flex min-h-[70vh] flex-col gap-4 rounded-3xl border bg-card/40 p-4 shadow-sm backdrop-blur">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>
      <ChatInput onSubmit={sendMessage} />
    </section>
  );
}

function QuickPrompts() {
  const prompts = [
    "show me running shoes",
    "compare iPhone 15 and Samsung S23",
    "summarize reviews for noise cancelling earbuds",
    "track order #1234",
    "add iPhone 15 Pro to cart",
    "checkout my cart",
  ];
  const { sendMessage } = useAgent();

  return (
    <section className="rounded-3xl border bg-muted/40 p-4">
      <p className="mb-3 text-sm font-semibold text-muted-foreground">
        Try quick prompts
      </p>
      <div className="flex flex-wrap gap-3">
        {prompts.map((prompt) => (
          <Button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            variant="secondary"
            className="text-sm"
          >
            {prompt}
          </Button>
        ))}
      </div>
    </section>
  );
}
