import type { Request, Response } from "express";
import { prisma } from "../db";
import { streamAIResponse, type ChatMessage } from "../lib/ai-service";

export async function chatStream(req: Request, res: Response) {
  const abort = new AbortController();
  const send = (data: any, event?: string) => {
    if (event) res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  const endWithError = (message: string) => {
    try {
      send({ message, message_es: message }, "error");
      res.end();
    } catch {}
  };
  try {
    const { conversationId, messages, model } = req.body as {
      conversationId: string;
      messages: ChatMessage[];
      model?: string;
    };

    // Usar el modelo especificado o el por defecto
    const selectedModel = model || process.env.OLLAMA_MODEL || 'llama3.1:8b';

    if (!conversationId || !Array.isArray(messages)) {
      res.status(400).json({ message: "conversationId y messages son requeridos" });
      return;
    }

    // Build bounded history from DB (server-side truncation)
    const turnsLimit = Math.max(1, parseInt(process.env.CHAT_TURNS_LIMIT || "20", 10));
    const maxHistoryMsgs = turnsLimit * 2;
    let history: ChatMessage[] = [];
    let nonSystemCount = 0;
    try {
      const historyDb = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true },
      });
      const systemSummary = [...historyDb].reverse().find((m) => m.role === "system");
      const nonSystem = historyDb.filter((m) => m.role !== "system");
      nonSystemCount = nonSystem.length;
      const truncated = nonSystem
        .slice(-maxHistoryMsgs)
        .map((m) => ({ role: m.role as ChatMessage['role'], content: m.content }));
      history = systemSummary
        ? [{ role: 'system', content: systemSummary.content }, ...truncated]
        : truncated;
    } catch {
      // If DB is not available, continue with empty history
      history = [];
      nonSystemCount = 0;
    }

    // Persist last user message (if provided)
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser?.content?.trim()) {
      try {
        await prisma.message.create({
          data: {
            conversationId,
            role: "user",
            content: lastUser.content,
          },
        });
      } catch {}
    }

    // Abort si el cliente cierra la conexión
    req.on("close", () => {
      abort.abort(new Error("client closed"));
    });

    let full = "";
    
    // Sistema inteligente multilingüe para CuraCall
    const systemPrompt: ChatMessage = {
      role: "system",
      content: `Eres CuraCall AI, un asistente médico virtual especializado y empático. Tu misión es proporcionar información médica precisa, apoyo emocional y orientación de salud.

CARACTERÍSTICAS PRINCIPALES:
- Responde en el idioma del usuario (español o inglés automáticamente)
- Proporciona información médica basada en evidencia
- Mantén un tono profesional pero cálido y empático
- Siempre recomienda consultar con profesionales médicos para diagnósticos
- Ofrece apoyo emocional cuando sea apropiado
- Sé conciso pero completo en tus respuestas

CAPACIDADES:
✓ Información sobre síntomas y condiciones médicas
✓ Primeros auxilios y cuidados básicos
✓ Orientación sobre cuándo buscar atención médica
✓ Apoyo emocional y bienestar mental
✓ Consejos de prevención y estilo de vida saludable
✓ Explicación de procedimientos médicos comunes

LIMITACIONES IMPORTANTES:
- NO puedes diagnosticar enfermedades
- NO puedes prescribir medicamentos
- NO reemplazas la consulta médica profesional
- Siempre deriva casos urgentes a servicios de emergencia

RESPUESTA IDEAL:
- Saluda de manera cálida
- Proporciona información útil y precisa
- Incluye cuándo buscar ayuda profesional
- Ofrece apoyo emocional si es necesario
- Termina preguntando si necesita más información

Ejemplo de respuesta en español:
"Hola, entiendo tu preocupación. [Información médica]. Es importante que consultes con un médico para una evaluación completa. ¿Hay algo más en lo que pueda ayudarte?"

Ejemplo de respuesta en inglés:
"Hello, I understand your concern. [Medical information]. It's important to consult with a doctor for a complete evaluation. Is there anything else I can help you with?"`
    };
    
    // Mensajes enviados al servicio de AI: sistema + historial truncado + mensajes del body
    const merged: ChatMessage[] = [systemPrompt, ...history, ...messages];

    // Usar el servicio unificado de AI que maneja tanto Ollama como OpenRouter
    full = await streamAIResponse(req, res, merged, selectedModel, conversationId);
    
    // Persistir la respuesta completa en la base de datos
    if (full.trim()) {
      try {
        await prisma.message.create({
          data: {
            conversationId,
            role: "assistant",
            content: full,
          },
        });
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
      } catch {}
    }

    // Resumir de forma asíncrona si se superó el límite de turnos
    const SUM_TURNS = Math.max(1, parseInt(process.env.SUMMARIZE_AFTER_TURNS || "12", 10));
    const totalNonSystem = nonSystemCount + (lastUser?.content ? 1 : 0) + (full ? 1 : 0);
    if (totalNonSystem > SUM_TURNS * 2) {
      // Ejecutar sin bloquear la respuesta
      import('../lib/summarizer').then(({ summarizeConversation }) => {
        summarizeConversation(conversationId, { turnsToKeep: SUM_TURNS }).catch(() => {});
      });
    }
  } catch (err: any) {
    const msg = err?.message || "Error en chat stream";
    endWithError(msg);
  }
}
