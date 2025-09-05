let CURRENT_AUDIO: HTMLAudioElement | null = null;

export async function speakWithCoqui(
  text: string,
  opts?: { language?: string; speakerWavB64?: string; speaker?: string; rate?: number }
) {
  const base = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
  const res = await fetch(`${base}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      language: opts?.language || "en",
      speaker_wav_b64: opts?.speakerWavB64 || null,
      speaker: opts?.speaker || null
    })
  });
  if (!res.ok) throw new Error(await res.text());

  // Cancelar cualquier síntesis previa del navegador (por si quedó algo)
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  // Asegurar solo un Audio activo
  if (CURRENT_AUDIO) {
    try { CURRENT_AUDIO.pause(); } catch {}
    try { URL.revokeObjectURL(CURRENT_AUDIO.src); } catch {}
    CURRENT_AUDIO = null;
  }

  const blob = await res.blob(); // audio/wav
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  // Velocidad de reproducción: 0.5–2.0 (default 1.35x)
  const saved = Number(localStorage.getItem("COQUI_RATE") || 1.35);
  const rate = Math.min(2, Math.max(0.5, opts?.rate ?? saved));
  audio.playbackRate = rate;

  CURRENT_AUDIO = audio;
  await audio.play();
  audio.onended = () => {
    try { URL.revokeObjectURL(url); } catch {}
    if (CURRENT_AUDIO === audio) CURRENT_AUDIO = null;
  };
}

// Normaliza puntuación para evitar silencios innecesarios
export function tighten(text: string) {
  return text
    .replace(/…/g, ".")
    .replace(/\s*[,;:]\s+/g, ", ")
    .replace(/\s*[.?!]\s+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

// Reproducir en cola, frase por frase (evita solapes)
export async function speakQueued(
  text: string,
  opts?: { language?: string; speakerWavB64?: string; speaker?: string; rate?: number }
) {
  const clean = tighten(text);
  
  // Si el texto es corto, reproducirlo completo
  if (clean.length <= 200) {
    await speakWithCoqui(clean, opts);
    return;
  }
  
  // Para textos largos, dividir de manera más inteligente
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  
  // Agrupar oraciones cortas para evitar fragmentación excesiva
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= 300) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  
  // Reproducir cada chunk completo
  for (const chunk of chunks) {
    if (chunk.trim()) {
      await speakWithCoqui(chunk, opts);
    }
  }
}