import type { Request, Response } from "express";
import { prisma } from "../db";

export async function listMessages(req: Request, res: Response) {
  const { conversationId } = req.params;
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages);
}

