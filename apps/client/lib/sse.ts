export type SSEEvent = {
  event?: string;
  data: string;
};

/**
 * Minimal SSE parser for fetch() streaming responses.
 * Supports `event:` and `data:` lines, terminated by a blank line.
 */
export async function* parseSSE(stream: ReadableStream<Uint8Array>): AsyncGenerator<SSEEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const idx = buffer.indexOf("\n\n");
      if (idx === -1) break;
      const rawEvent = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      let event: string | undefined;
      const dataLines: string[] = [];
      for (const line of rawEvent.split("\n")) {
        const trimmed = line.replace(/\r$/, "");
        if (trimmed.startsWith("event:")) event = trimmed.slice("event:".length).trim();
        if (trimmed.startsWith("data:")) dataLines.push(trimmed.slice("data:".length).trimStart());
      }

      yield { event, data: dataLines.join("\n") };
    }
  }
}

