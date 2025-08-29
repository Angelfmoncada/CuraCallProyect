import type { Request, Response } from "express";
import { streamOllamaChat, type ChatMessage, ensureModelAvailable } from "./ollama";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const PING_MS = Math.max(5_000, parseInt(process.env.SSE_PING_MS || "30000", 10));
const FIRST_TOKEN_TIMEOUT_MS = Math.max(5_000, parseInt(process.env.OPENROUTER_TIMEOUT_MS || "20000", 10));

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

async function delay(ms: number) { 
  return new Promise(r => setTimeout(r, ms)); 
}

/**
 * Determina si un modelo debe usar Ollama (local) o OpenRouter (cloud)
 */
export function isOllamaModel(model: string): boolean {
  return model === 'llama3.1:8b' || model.includes('llama') || model.includes(':');
}

/**
 * Servicio unificado de AI que maneja tanto Ollama como OpenRouter
 */
export async function streamAIResponse(
  req: Request,
  res: Response,
  messages: ChatMessage[],
  model: string,
  conversationId?: string
): Promise<string> {
  const abort = new AbortController();
  let fullResponse = "";
  const cleanup = () => {
    try {
      abort.abort();
    } catch {}
  };
  
  req.on('close', cleanup);
  req.on('error', cleanup);

  try {
    if (isOllamaModel(model)) {
      fullResponse = await streamOllamaResponse(res, messages, model, abort.signal);
    } else {
      fullResponse = await streamOpenRouterResponse(res, messages, model, abort.signal);
    }
    return fullResponse;
  } catch (error: any) {
    console.error('AI Service Error:', error);
    try {
      sse(res);
      send(res, 'fallback', { text: 'Lo siento, ocurrió un error inesperado. Intenta nuevamente.' });
      send(res, 'done');
      res.end();
    } catch {}
    return "";
  }
}

/**
 * Maneja streaming con Ollama (modelos locales)
 */
async function streamOllamaResponse(
  res: Response,
  messages: ChatMessage[],
  model: string,
  signal: AbortSignal
): Promise<string> {
  // Verificar que el modelo esté disponible
  const isAvailable = await ensureModelAvailable(model);
  if (!isAvailable) {
    sse(res);
    send(res, 'fallback', { 
      text: `El modelo ${model} no está disponible. Por favor, asegúrate de que Ollama esté ejecutándose y el modelo esté instalado.` 
    });
    send(res, 'done');
    return res.end();
  }

  sse(res);
  const ping = setInterval(() => { 
    try { res.write(`: ping\n\n`); } catch {} 
  }, PING_MS);
  
  const cleanup = () => clearInterval(ping);

  try {
    let accumulated = '';
    
    for await (const chunk of streamOllamaChat(messages, { 
      model, 
      signal,
      temperature: 0.7,
      num_ctx: 4096
    })) {
      if (signal.aborted) break;
      
      if (chunk.delta) {
        accumulated += chunk.delta;
        send(res, 'token', { text: chunk.delta });
      }
      
      if (chunk.done) {
        send(res, 'done');
        break;
      }
    }
    return accumulated;
  } catch (error: any) {
    console.error('Ollama streaming error:', error);
    send(res, 'fallback', { 
      text: 'Error al comunicarse con el modelo local. Verifica que Ollama esté funcionando correctamente.' 
    });
    send(res, 'done');
    return "";
  } finally {
    cleanup();
    res.end();
  }
}

/**
 * Maneja streaming con OpenRouter (modelos en la nube)
 */
async function streamOpenRouterResponse(
  res: Response,
  messages: ChatMessage[],
  model: string,
  signal: AbortSignal
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    sse(res);
    send(res, 'fallback', { text: 'Configuración de API faltante para modelos en la nube.' });
    send(res, 'done');
    return res.end();
  }

  sse(res);
  const ping = setInterval(() => { 
    try { res.write(`: ping\n\n`); } catch {} 
  }, PING_MS);
  
  const cleanup = () => clearInterval(ping);

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${key}`,
    "Content-Type": "application/json",
    "HTTP-Referer": ORIGIN,
    "X-Title": "CuraCall",
  };

  const body = JSON.stringify({ 
    model, 
    stream: true, 
    messages,
    temperature: 0.7,
    max_tokens: 2048
  });

  // Backoff en 429: hasta 3 intentos
  const delays = [0, 1000, 3000];
  let resp: globalThis.Response | null = null;
  
  for (let i = 0; i < delays.length; i++) {
    if (signal.aborted) return;
    
    if (delays[i] > 0) await delay(delays[i]);
    
    try {
      resp = await fetch(OPENROUTER_API_URL, { 
        method: 'POST', 
        headers, 
        body,
        signal 
      });
      
      if (resp.status === 429 && i < delays.length - 1) {
        continue;
      }
      break;
    } catch (error: any) {
      if (signal.aborted) return;
      if (i === delays.length - 1) {
        throw error;
      }
    }
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
  const ttftTimer = setTimeout(() => { 
    if (!sentAnyToken) {
      try { res.write(`: first-token-timeout\n\n`); } catch {}
    }
  }, FIRST_TOKEN_TIMEOUT_MS);

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();

  try {
    let buffer = '';
    let fullResponse = '';
    
    while (true) {
      if (signal.aborted) break;
      
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // OpenRouter/OpenAI estilo SSE: bloques separados por \n\n
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
          res.end();
          return fullResponse;
        }
        
        try {
          const json = JSON.parse(payload);
          const delta = json?.choices?.[0]?.delta?.content || json?.choices?.[0]?.message?.content || '';
          
          if (delta) {
            if (!sentAnyToken) {
              sentAnyToken = true;
              const ttft = Date.now() - startedAt;
              console.log(`[openrouter] TTFT ${ttft}ms`);
              clearTimeout(ttftTimer);
            }
            fullResponse += delta;
            send(res, 'token', { text: delta });
          }
        } catch {
          // ignora líneas no JSON
        }
      }
    }
    
    send(res, 'done');
    return fullResponse;
  } catch (error: any) {
    console.error('OpenRouter streaming error:', error);
    if (!sentAnyToken) {
      send(res, 'fallback', { text: 'Lo siento, hubo un problema temporal con el motor. Intentemos de nuevo.' });
    }
    send(res, 'done');
    return "";
  } finally {
    clearTimeout(ttftTimer);
    cleanup();
    res.end();
  }
}

/**
 * Health check unificado para ambos servicios
 */
export async function checkAIHealth(model: string) {
  try {
    if (isOllamaModel(model)) {
      const isAvailable = await ensureModelAvailable(model);
      return {
        ok: isAvailable,
        service: 'ollama',
        model,
        message: isAvailable ? 'Modelo disponible' : 'Modelo no disponible'
      };
    } else {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key) {
        return {
          ok: false,
          service: 'openrouter',
          model,
          message: 'API key no configurada'
        };
      }
      
      const headers = {
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': ORIGIN,
        'X-Title': 'CuraCall',
      };
      
      const response = await fetch('https://openrouter.ai/api/v1/models', { headers });
      
      if (response.ok) {
        const data = await response.json();
        const models = Array.isArray(data?.data) ? data.data : [];
        const hasModel = models.some((m: any) => m?.id === model);
        
        return {
          ok: hasModel,
          service: 'openrouter',
          model,
          message: hasModel ? 'Modelo disponible' : 'Modelo no encontrado'
        };
      } else {
        return {
          ok: false,
          service: 'openrouter',
          model,
          message: `Error ${response.status}`
        };
      }
    }
  } catch (error: any) {
    return {
      ok: false,
      service: isOllamaModel(model) ? 'ollama' : 'openrouter',
      model,
      message: error.message || 'Error desconocido'
    };
  }
}