import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { type Message } from "ai";
import { sql } from "drizzle-orm";

export const chats = pgTable("chats", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  messages: jsonb("messages").$type<Message[]>().notNull(),
  streamIds: jsonb("stream_ids").$type<string[]>().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
