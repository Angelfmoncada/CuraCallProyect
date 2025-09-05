import { prisma } from "../db";
import { streamOllamaChat, type ChatMessage, ensureModelAvailable } from "./ollama";

export interface SummarizeOptions {
  turnsToKeep?: number; // keep last N turns verbatim
  temperature?: number;
  timeoutMs?: number;
}

/**
 * Resume la conversación y guarda/actualiza un mensaje con rol "system".
 */
export async function summarizeConversation(conversationId: string, opts: SummarizeOptions = {}) {
  const turnsToKeep = Math.max(1, opts.turnsToKeep ?? parseInt(process.env.SUMMARIZE_AFTER_TURNS || "12", 10));
  const all = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, createdAt: true },
  });

  const nonSystem = all.filter((m) => m.role !== "system");
  const toKeep = nonSystem.slice(-turnsToKeep * 2);
  const toSummarize = nonSystem.slice(0, Math.max(0, nonSystem.length - toKeep.length));

  if (toSummarize.length === 0) {
    return { ok: true, summary: "" } as const;
  }

  // Mensaje de sistema para el summarizer
  const system: ChatMessage = {
    role: "system",
    content:
      "Eres un compresor de contexto para una conversación larga. Resume de forma precisa, breve y neutra: \n" +
      "- Conserva hechos, nombres, fechas y decisiones.\n" +
      "- Omite saludos y relleno.\n" +
      "- Devuelve 5-10 viñetas claras.\n" +
      "- Idioma del resumen: español.\n",
  };

  // Construir mensajes de entrada: resumen del bloque antiguo
  const input: ChatMessage[] = [system, ...toSummarize.map((m) => ({ role: m.role as any, content: m.content }))];

  // Asegurar disponibilidad del modelo
  if (!(await ensureModelAvailable())) {
    throw new Error("Modelo de Ollama no disponible para resumir");
  }

  // Ejecutar chat en modo stream y acumular
  let summary = "";
  for await (const part of streamOllamaChat(input, { temperature: opts.temperature ?? 0.2, timeoutMs: opts.timeoutMs ?? 90_000 })) {
    if (part.delta) summary += part.delta;
  }

  const trimmed = summary.trim();
  if (!trimmed) return { ok: false, summary: "" } as const;

  // Guardar como mensaje de sistema (upsert: si existe el último system, actualizarlo; si no, crear)
  const lastSystem = [...all].reverse().find((m) => m.role === "system");
  if (lastSystem) {
    await prisma.message.update({ where: { id: lastSystem.id }, data: { content: trimmed } });
  } else {
    await prisma.message.create({ data: { conversationId, role: "system", content: trimmed } });
  }

  return { ok: true, summary: trimmed } as const;
}

