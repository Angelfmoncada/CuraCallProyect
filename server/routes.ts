import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { handleChatRequest, handleHealthCheck } from "./api/chat";
import { chatStream } from "./routes/chat";
import { createConversation, deleteConversation, listConversations, patchConversation, summarize } from "./routes/conversations";
import { aiProxy } from "./routes/ai";
import { openRouterStream, openRouterHealth } from "./routes/openrouter";
import { listMessages } from "./routes/messages";

export async function registerRoutes(app: Express): Promise<Server> {
  // Chat API endpoints (demo legacy) y nuevo stream con Ollama
  app.post("/api/chat", handleChatRequest);
  app.post("/api/chat/stream", chatStream);
  app.post("/api/ai", aiProxy);
  app.post("/api/ai/stream", openRouterStream);
  app.get("/api/ai/health", openRouterHealth);
  app.get("/api/health", handleHealthCheck);

  // Additional application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Conversations
  app.post("/api/conversations", createConversation);
  app.get("/api/conversations", listConversations);
  app.patch("/api/conversations/:id", patchConversation);
  app.delete("/api/conversations/:id", deleteConversation);
  app.post("/api/conversations/:id/summarize", summarize);

  // Messages
  app.get("/api/messages/:conversationId", listMessages);

  const httpServer = createServer(app);

  return httpServer;
}
