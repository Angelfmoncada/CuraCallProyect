const BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

type Role = "user" | "assistant" | "system";

export interface ChatMessage { role: Role; content: string }

export interface OllamaChatOptions {
  signal?: AbortSignal;
  temperature?: number;
  num_ctx?: number;
  num_predict?: number;
  top_p?: number;
  stop?: string[];
  timeoutMs?: number;
  model?: string;
  baseUrl?: string;
}

/**
 * Verifica si el modelo está disponible en la instancia de Ollama
 */
export async function ensureModelAvailable(model = MODEL, baseUrl = BASE_URL): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`);
    if (res.ok) {
      const data: any = await res.json().catch(() => ({}));
      const list: any[] = data?.models || [];
      if (list.some((m) => m?.name === model || m?.model === model || String(m?.name || "").startsWith(model))) {
        return true;
      }
    }
  } catch {}
  try {
    const r2 = await fetch(`${baseUrl}/api/show`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: model }),
    });
    return r2.ok;
  } catch {}
  return false;
}

/**
 * Stream de chat a Ollama con parsing robusto de NDJSON.
 * Devuelve deltas incrementales y el texto acumulado.
 */
export async function* streamOllamaChat(messages: ChatMessage[], options: OllamaChatOptions = {}) {
  const model = options.model || MODEL;
  const baseUrl = options.baseUrl || BASE_URL;

  const body = {
    model,
    stream: true,
    messages,
    options: {
      num_ctx: options.num_ctx ?? 4096,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p,
      num_predict: options.num_predict,
      stop: options.stop,
    },
  } as any;

  // Limpia undefined en options
  if (body.options) {
    Object.keys(body.options).forEach((k) => body.options[k] === undefined && delete body.options[k]);
  }

  const controller = new AbortController();
  const signals: AbortSignal[] = [];
  if (options.signal) signals.push(options.signal);
  const timeout = options.timeoutMs && options.timeoutMs > 0 ? setTimeout(() => controller.abort(new Error("timeout")), options.timeoutMs) : undefined;
  const onAbort = (reason?: any) => controller.abort(reason);
  if (options.signal) {
    options.signal.addEventListener("abort", () => onAbort(options.signal?.reason), { once: true });
  }

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal: controller.signal,
  });

  try {
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      throw new Error(`Ollama error ${res.status}: ${text}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // NDJSON: líneas separadas por \n
      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        try {
          const json = JSON.parse(line);
          const delta: string = json?.message?.content ?? json?.response ?? "";
          if (delta) {
            accumulated += delta;
            yield { delta, accumulated, done: false } as const;
          }
          if (json?.done) {
            // Último chunk: intentar propagar métricas si existen
            yield { delta: "", accumulated, done: true } as const;
          }
        } catch {
          // Línea inválida: ignorar (Ollama puede enviar logs/eventos no-JSON)
        }
      }
    }
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
