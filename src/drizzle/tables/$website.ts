import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const $website = sqliteTable("website", {
  id: text().primaryKey(),
  created: text().notNull(),
  hostname: text().notNull(),
});
