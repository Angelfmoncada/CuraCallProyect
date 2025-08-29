export type Role = 'user' | 'assistant' | 'system';
export interface ChatMessage { role: Role; content: string }

// Stream chat via SSE-like response using fetch and ReadableStream
export async function streamChat(
  conversationId: string,
  messages: ChatMessage[],
  onDelta: (delta: string) => void
): Promise<string> {
  const res = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, messages })
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    throw new Error(`Chat stream error ${res.status}: ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';
    for (const evt of parts) {
      const lines = evt.split('\n');
      const evType = (lines.find(l => l.startsWith('event:')) || '').slice(6).trim();
      const line = lines.find(l => l.startsWith('data:'));
      if (!line) continue;
      try {
        const data = JSON.parse(line.slice(5).trim());
        if (evType === 'error') {
          const msg = data?.message || 'Chat stream error';
          throw new Error(String(msg));
        }
        const delta = data.delta as string;
        if (delta) {
          full += delta;
          onDelta(delta);
        }
      } catch {
        // ignore parse errors from other lines
      }
    }
  }

  return full;
}
