import type { Request, Response } from "express";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.MODEL || process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat-v3-0324:free";
const ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const PING_MS = Math.max(5_000, parseInt(process.env.SSE_PING_MS || "30000", 10));
const FIRST_TOKEN_TIMEOUT_MS = Math.max(5_000, parseInt(process.env.OPENROUTER_TIMEOUT_MS || "20000", 10));
const MAX_TURNS = Math.max(1, parseInt(process.env.HISTORY_TURNS_LIMIT || "12", 10));

function sse(res: Response) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
}

function send(res: Response, event: string, data?: any) {
  if (event) res.write(`event: ${event}\n`);
  if (data !== undefined) res.write(`data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`);
  else res.write(`\n`);
}

async function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function openRouterStream(req: Request, res: Response) {
  try {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      res.status(500).json({ message: "Falta OPENROUTER_API_KEY en el backend" });
      return;
    }

    const { text, history, lang, model }: {
      text: string;
      history?: Array<{ role: 'system'|'user'|'assistant'; content: string }>;
      lang?: string;
      model?: string;
    } = req.body || {};

    if (!text || typeof text !== 'string') {
      res.status(400).json({ message: "Se requiere 'text'" });
      return;
    }

    sse(res);
    const ping = setInterval(() => { try { res.write(`: ping\n\n`); } catch {} }, PING_MS);
    const cleanup = () => clearInterval(ping);
    req.on('close', cleanup);

    const system = `Eres CuraCall, asistente bilingüe (ES/EN). Responde en el idioma del usuario con claridad y precisión.${lang ? ` Prioriza respuestas en ${lang}.` : ''}`;

    const trimmedHistory = Array.isArray(history) ? history.slice(-MAX_TURNS * 2) : [];
    const messages = [ { role: 'system', content: system }, ...trimmedHistory, { role: 'user', content: text } ];

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": ORIGIN,
      "X-Title": "CuraCall",
    };

    const selectedModel = (typeof model === 'string' && model.trim().length > 0) ? model : DEFAULT_MODEL;
    const body = JSON.stringify({ model: selectedModel, stream: true, messages });

    // Backoff en 429: hasta 3 intentos (0ms, 1000ms, 3000ms)
    const delays = [0, 1000, 3000];
    let resp: globalThis.Response | null = null;
    for (let i = 0; i < delays.length; i++) {
      if (delays[i] > 0) await delay(delays[i]);
      resp = await fetch(API_URL, { method: 'POST', headers, body }).catch(() => null);
      if (!resp) continue;
      if (resp.status === 429 && i < delays.length - 1) continue;
      break;
    }

    if (!resp || !resp.ok || !resp.body) {
      const msg = resp ? `Error ${resp.status}` : 'Sin respuesta del proveedor';
      send(res, 'fallback', { text: `Lo siento, hubo un problema temporal (${msg}). Intenta de nuevo.` });
      send(res, 'done');
      cleanup();
      return res.end();
    }

    const startedAt = Date.now();
    let sentAnyToken = false;
    const ttftTimer = setTimeout(() => { if (!sentAnyToken) try { res.write(`: first-token-timeout\n\n`); } catch {}; }, FIRST_TOKEN_TIMEOUT_MS);

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();

    try {
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // OpenRouter/OpenAI estilo SSE: bloques separados por \n\n, cada bloque con líneas event:/data:
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const block of parts) {
          const lines = block.split('\n');
          const dataLine = lines.find(l => l.startsWith('data:'));
          if (!dataLine) continue;
          const payload = dataLine.slice(5).trim();
          if (!payload || payload === '[DONE]') {
            send(res, 'done');
            cleanup();
            return res.end();
          }
          try {
            const json = JSON.parse(payload);
            const delta = json?.choices?.[0]?.delta?.content || json?.choices?.[0]?.message?.content || '';
            if (delta) {
              if (!sentAnyToken) {
                sentAnyToken = true;
                const ttft = Date.now() - startedAt;
                // log simple
                try { console.log(`[openrouter] TTFT ${ttft}ms`); } catch {}
                clearTimeout(ttftTimer);
              }
              send(res, 'token', { text: delta });
            }
          } catch {
            // ignora líneas no JSON
          }
        }
      }
      send(res, 'done');
      cleanup();
      return res.end();
    } catch (err: any) {
      if (!sentAnyToken) {
        send(res, 'fallback', { text: 'Lo siento, hubo un problema temporal con el motor. Intentemos de nuevo.' });
      }
      send(res, 'done');
      cleanup();
      return res.end();
    } finally {
      clearTimeout(ttftTimer);
    }
  } catch (e: any) {
    try {
      sse(res);
      send(res, 'fallback', { text: 'Lo siento, ocurrió un error inesperado. Intenta nuevamente.' });
      send(res, 'done');
      res.end();
    } catch {
      res.status(500).json({ message: e?.message || 'Error interno' });
    }
  }
}

// Health check: valida API key y disponibilidad del modelo sin consumir tokens (GET /models)
export async function openRouterHealth(_req: Request, res: Response) {
  try {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return res.status(500).json({ ok: false, message: 'Falta OPENROUTER_API_KEY' });
    const model = process.env.MODEL || 'deepseek/deepseek-chat-v3-0324:free';
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': ORIGIN,
      'X-Title': 'CuraCall',
    };
    const r = await fetch('https://openrouter.ai/api/v1/models', { headers });
    const ok = r.ok;
    let hasModel = false;
    let status = r.status;
    if (ok) {
      const data = await r.json().catch(() => ({}));
      const list: any[] = Array.isArray(data?.data) ? data.data : [];
      hasModel = list.some((m) => m?.id === model);
    }
    return res.json({ ok, status, model, hasModel });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message || 'Error en health' });
  }
}
