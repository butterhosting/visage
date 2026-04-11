import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const $token = sqliteTable("token", {
  id: text().primaryKey(),
  created: text().notNull(),
  websites: text().notNull(),
  lastUsed: text(),
  secretHash: text().notNull(),
});
