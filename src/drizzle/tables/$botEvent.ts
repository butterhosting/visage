import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const $botEvent = sqliteTable("bot_event", {
  id: text().primaryKey(),
  json: text().notNull(),
});
