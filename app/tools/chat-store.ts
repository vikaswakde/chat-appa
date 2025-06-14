import { generateId, type Message } from "ai";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function createChat(): Promise<string> {
  const id = generateId();
  await db.insert(chats).values({ id, messages: [], streamIds: [] });
  return id;
}

export async function loadChat(id: string): Promise<Message[]> {
  const result = await db.select().from(chats).where(eq(chats.id, id));
  if (result.length === 0) {
    return [];
  }
  return result[0].messages;
}

export async function saveChat({
  id,
  messages,
}: {
  id: string;
  messages: Message[];
}): Promise<void> {
  await db
    .update(chats)
    .set({ messages, updatedAt: new Date() })
    .where(eq(chats.id, id));
}

export async function loadStreams(id: string): Promise<string[]> {
  const result = await db.select().from(chats).where(eq(chats.id, id));
  if (result.length === 0 || !result[0].streamIds) {
    return [];
  }
  return result[0].streamIds;
}

export async function appendStreamId({
  chatId,
  streamId,
}: {
  chatId: string;
  streamId: string;
}): Promise<void> {
  await db
    .update(chats)
    .set({
      streamIds: sql`${chats.streamIds} || to_jsonb(${streamId}::text)`,
    })
    .where(eq(chats.id, chatId));
}
