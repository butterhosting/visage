import { Sqlite } from "@/drizzle/sqlite";
import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { rm } from "fs/promises";
import { RegressionSuite } from "./RegressionSuite";

describe("regression", () => {
  let sqlite: Sqlite;

  beforeEach(async () => {
    sqlite?.close();
    sqlite = await RegressionSuite.Database.getRegressionDatabaseCopy();
  });

  afterAll(async () => {
    await rm(RegressionSuite.Path.suiteTmp, { recursive: true, force: true });
  });

  describe("database querying", async () => {
    for (const { table, queryFn } of RegressionSuite.Database.getQueryFns()) {
      it(table, async () => {
        // when
        const records = await queryFn(sqlite);
        // then
        expect(records.length).toBeGreaterThan(0);
      });
    }
  });
});
