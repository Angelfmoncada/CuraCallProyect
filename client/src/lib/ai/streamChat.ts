export type Role = 'system' | 'user' | 'assistant';

export interface HistoryMsg { role: Role; content: string }

export interface StreamOptions {
  prompt: string;
  history?: HistoryMsg[];
  lang?: string;
  model?: string;
  onToken?: (delta: string) => void;
  onDone?: (full: string) => void;
  onError?: (err: string) => void;
}

export function streamChat({ prompt, history = [], lang, model, onToken, onDone, onError }: StreamOptions) {
  const controller = new AbortController();
  let full = '';
  let closed = false;

  async function start() {
    try {
      const res = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt, history, lang, model }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';
        for (const block of chunks) {
          const lines = block.split('\n');
          const eventLine = lines.find(l => l.startsWith('event:'));
          const dataLine = lines.find(l => l.startsWith('data:'));
          const event = eventLine ? eventLine.slice(6).trim() : 'token';
          const dataRaw = dataLine ? dataLine.slice(5).trim() : '';
          try {
            if (event === 'token') {
              const data = JSON.parse(dataRaw);
              const delta = data?.text ?? '';
              if (delta) {
                full += delta;
                onToken?.(delta);
              }
            } else if (event === 'fallback') {
              const data = JSON.parse(dataRaw);
              const msg = data?.text || 'Respuesta alternativa.';
              full += msg;
              onToken?.(msg);
            } else if (event === 'done') {
              closed = true;
              onDone?.(full);
            }
          } catch {
            // ignora bloques malformados
          }
        }
      }
      if (!closed) onDone?.(full);
    } catch (e: any) {
      onError?.(e?.message || 'Error en streaming');
    }
  }

  function abort() {
    try { controller.abort(); } catch {}
  }

  return { start, abort };
}

