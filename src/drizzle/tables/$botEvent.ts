import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const $botEvent = sqliteTable("bot_event", {
  id: text().primaryKey(),
  created: text().notNull(),
  websiteId: text().notNull(),
  json: text().notNull(),
});
