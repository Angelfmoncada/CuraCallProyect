import type { Request, Response } from "express";

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";
const SSE_PING_MS = Math.max(5_000, parseInt(process.env.SSE_PING_MS || "30000", 10));
const FIRST_TOKEN_TIMEOUT_MS = Math.max(3_000, parseInt(process.env.OLLAMA_TIMEOUT_MS || "20000", 10));

function sseHeaders(res: Response) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
}

function sendData(res: Response, data: any, event?: string) {
  if (event) res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function isOllamaUp(): Promise<boolean> {
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { method: "GET", cache: "no-store" });
    return r.ok;
  } catch {
    return false;
  }
}

// Proxy endpoint to forward chat requests to local Ollama with SSE stream
export async function aiProxy(req: Request, res: Response) {
  try {
    const { messages, system, model = DEFAULT_MODEL } = req.body || {};

    const body = {
      model,
      stream: true,
      messages: [
        ...(system ? [{ role: "system", content: String(system) }] : []),
        ...((Array.isArray(messages) ? messages : []) as any[]),
      ],
    };

    sseHeaders(res);

    // Keep-alive ping
    const ping = setInterval(() => {
      try { res.write(`: ping\n\n`); } catch {}
    }, SSE_PING_MS);
    const cleanup = () => clearInterval(ping);
    req.on("close", cleanup);

    // Health check rápido
    if (!(await isOllamaUp())) {
      sendData(res, { level: "error", msg: "Ollama offline" }, "status");
      sendData(res, { message: { content: "Lo siento, el motor de IA está iniciándose. Respuesta de emergencia." } });
      sendData(res, { done: true }, "done");
      cleanup();
      return res.end();
    }

    let upstream: Response | null = null;
    // controlador de aborto y timeout para TTFT
    let sentAnyToken = false;
    const controller = new AbortController();
    req.on("close", () => controller.abort("client-closed"));
    const ttftTimer = setTimeout(() => controller.abort("ollama-timeout"), FIRST_TOKEN_TIMEOUT_MS);
    try {
      upstream = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      upstream = null;
    }

    if (!upstream || !upstream.ok || !upstream.body) {
      sendData(res, { level: "error", msg: "No hay conexión con Ollama" }, "status");
      sendData(res, { message: { content: "Lo siento, no puedo conectar con el modelo local ahora." } });
      sendData(res, { message: { content: "Estoy usando una respuesta de emergencia para no dejarte sin contestar." } });
      sendData(res, { done: true }, "done");
      cleanup();
      return res.end();
    }

    

    try {
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line) continue;
          try {
            const json = JSON.parse(line);
            const delta: string = json?.message?.content ?? json?.response ?? "";
            if (delta) {
              sentAnyToken = true;
              clearTimeout(ttftTimer);
              // reenviar como data JSON (compatible con cliente)
              sendData(res, json);
            }
            if (json?.done) {
              sendData(res, { done: true }, "done");
              cleanup();
              return res.end();
            }
          } catch {
            // ignora líneas no JSON
          }
        }
      }
      // stream cerrado sin done explícito
      sendData(res, { done: true }, "done");
      cleanup();
      return res.end();
    } catch (err: any) {
      // si no hubo tokens, enviar fallback
      if (!sentAnyToken) {
        sendData(res, { level: "warn", msg: "Usando fallback" }, "status");
        sendData(res, { message: { content: "Lo siento, hubo un problema temporal con el motor. Intentemos de nuevo." } });
        sendData(res, { done: true }, "done");
        cleanup();
        return res.end();
      }
      // si ya había tokens, cerrar educadamente
      sendData(res, { done: true }, "done");
      cleanup();
      return res.end();
    } finally {
      clearTimeout(ttftTimer);
    }
  } catch (e: any) {
    try {
      sseHeaders(res);
      const message = e?.message || "Error en proxy /api/ai";
      sendData(res, { message: { content: `Error: ${message}` } });
      sendData(res, { done: true }, "done");
      res.end();
    } catch {
      res.status(500).end(e?.message || "Error en proxy /api/ai");
    }
  }
}
