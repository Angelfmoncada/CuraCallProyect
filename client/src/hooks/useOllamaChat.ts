import { useState } from "react";
import { useSettings } from "@/store/settings";

export type Msg = { role: "user"|"assistant"|"system"; content: string };

export function useOllamaChat(system: string) {
  const [reply, setReply] = useState("");
  const [thinking, setThinking] = useState(false);
  const { settings } = useSettings();

  async function ask(history: Msg[], userText: string) {
    setReply("");
    setThinking(true);

    const model = settings.aiModel;
    const isCloud = typeof model === "string" && model.includes("/"); // e.g., "deepseek/..."

    // OpenRouter (cloud) path
    if (isCloud) {
      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: userText,
          history: history.map(m => ({ role: m.role, content: m.content })),
          lang: "es",
          model,
        }),
      });

      if (!res.ok || !res.body) {
        setThinking(false);
        throw new Error("OpenRouter no responde");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";
        for (const block of blocks) {
          const lines = block.split("\n");
          const eventLine = lines.find(l => l.startsWith("event:"));
          const dataLine = lines.find(l => l.startsWith("data:"));
          const event = eventLine ? eventLine.slice(6).trim() : "token";
          const dataRaw = dataLine ? dataLine.slice(5).trim() : "";
          try {
            if (event === "token") {
              const data = JSON.parse(dataRaw);
              const delta = data?.text ?? "";
              if (delta) {
                acc += delta;
                setReply(acc);
              }
            } else if (event === "fallback") {
              const data = JSON.parse(dataRaw);
              const msg = data?.text || "";
              if (msg) {
                acc += msg;
                setReply(acc);
              }
            } else if (event === "done") {
              setThinking(false);
              return acc;
            }
          } catch {
            // ignore malformed block
          }
        }
      }
      setThinking(false);
      return acc;
    }

    // Local Ollama path
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system,
        messages: [...history, { role: "user", content: userText }],
        model,
      }),
    });

    if (!res.ok || !res.body) {
      setThinking(false);
      throw new Error("Ollama no responde");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        const s = line.trim();
        if (!s.startsWith("data:")) continue;
        try {
          const json = JSON.parse(s.slice(5));
          const delta = json?.message?.content ?? json?.response ?? "";
          if (delta) {
            acc += delta;
            setReply(acc);
          }
        } catch {
          // ignore
        }
      }
    }
    setThinking(false);
    return acc;
  }

  return { reply, ask, thinking };
}
