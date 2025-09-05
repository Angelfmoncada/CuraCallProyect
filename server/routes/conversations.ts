import type { Request, Response } from "express";
import { prisma } from "../db";
import { summarizeConversation } from "../lib/summarizer";

export async function createConversation(req: Request, res: Response) {
  const { title, mode } = req.body as { title?: string; mode: string };
  if (!mode) return res.status(400).json({ message: "mode es requerido" });
  const conv = await prisma.conversation.create({
    data: {
      title: title?.trim() || "New Conversation",
      mode,
    },
  });
  res.json(conv);
}

export async function listConversations(_req: Request, res: Response) {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });
  res.json(conversations);
}

export async function patchConversation(req: Request, res: Response) {
  const { id } = req.params;
  const { archived } = req.body as { archived?: boolean };
  const conv = await prisma.conversation.update({
    where: { id },
    data: { archived: archived ?? undefined },
  });
  res.json(conv);
}

export async function deleteConversation(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.message.deleteMany({ where: { conversationId: id } });
  await prisma.conversation.delete({ where: { id } });
  res.json({ ok: true });
}

export async function summarize(req: Request, res: Response) {
  const { id } = req.params;
  const turns = req.body?.turnsToKeep as number | undefined;
  try {
    const result = await summarizeConversation(id, { turnsToKeep: turns });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ ok: false, message: e?.message || "Error al resumir" });
  }
}
