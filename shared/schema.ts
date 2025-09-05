import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  messages: jsonb("messages").notNull().default([]),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default("default"),
  theme: text("theme").notNull().default("dark-ocean"),
  voiceSpeed: text("voice_speed").notNull().default("1"),
  autoPlay: boolean("auto_play").notNull().default(true),
  saveConversations: boolean("save_conversations").notNull().default(true),
  aiModel: text("ai_model").notNull().default("llama3.1:8b"),
  responseLength: text("response_length").notNull().default("balanced"),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  title: true,
  messages: true,
  archived: true,
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  theme: true,
  voiceSpeed: true,
  autoPlay: true,
  saveConversations: true,
  aiModel: true,
  responseLength: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};
