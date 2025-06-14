CREATE TABLE "chats" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"messages" jsonb NOT NULL,
	"stream_ids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
