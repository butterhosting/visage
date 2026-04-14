import { AnalyticsEventConverter } from "@/drizzle/converters/AnalyticsEventConverter";
import { TokenConverter } from "@/drizzle/converters/TokenConverter";
import { WebsiteConverter } from "@/drizzle/converters/WebsiteConverter";
import * as schema from "@/drizzle/schema";
import { $analyticsEvent, $botEvent, $token, $website } from "@/drizzle/schema";
import { Sqlite } from "@/drizzle/sqlite";
import { Env } from "@/Env";
import { Website } from "@/models/Website";
import { test } from "bun:test";
import { InferInsertModel } from "drizzle-orm";
import { join } from "path";

test.skip("regression suite management", async () => {
  // manually update the regression database
});

export namespace RegressionSuite {
  export const Path = {
    suite: join(import.meta.dir, "suite"),
    get suiteTmp() {
      return join(this.suite, ".tmp");
    },
  };

  /**
   * Helper functions for reading/writing the regression database
   */
  export namespace Database {
    type Schema = typeof schema;
    type TableKey = Exclude<Extract<keyof Schema, string>, `${string}Relations`>;
    type Tables = {
      [K in TableKey]: Schema[K];
    };
    type TableRecords = {
      [K in keyof Tables]: Array<InferInsertModel<Tables[K]>>;
    };

    export function getQueryFns(): Array<{ table: string; queryFn: (sqlite: Sqlite) => Promise<unknown[]> }> {
      const overview: Record<TableKey, (sqlite: Sqlite) => Promise<unknown[]>> = {
        $website: (sqlite) => sqlite.query.$website.findMany().then((records) => records.map<Website>(WebsiteConverter.convert)),
        $analyticsEvent: (sqlite) =>
          sqlite.query.$analyticsEvent.findMany().then((records) => records.map(AnalyticsEventConverter.convert)),
        $botEvent: (sqlite) => sqlite.query.$botEvent.findMany(),
        $token: (sqlite) => sqlite.query.$token.findMany().then((records) => records.map(TokenConverter.convert)),
      };
      return Object.entries(overview).map(([table, queryFn]) => ({ table, queryFn }));
    }

    const databasePath = join(Path.suite, "db.sqlite");
    export async function getRegressionDatabaseCopy(): Promise<Sqlite> {
      const file = Bun.file(databasePath);
      if (!(await file.exists())) {
        throw new Error(`Regression database not found: ${databasePath}`);
      }
      const databaseCopyPath = join(Path.suiteTmp, "db.sqlite");
      await Bun.write(databaseCopyPath, file);
      return await Sqlite.initialize({ X_VISAGE_DATABASE: databaseCopyPath } as Env.Private);
    }

    /** @public */
    export async function insertIntoRegressionDatabase({
      $website: websites,
      $analyticsEvent: analyticsEvents,
      $botEvent: botEvents,
      $token: tokens,
    }: TableRecords) {
      const file = Bun.file(databasePath);
      if (await file.exists()) {
        await file.delete();
      }
      const sqlite = await Sqlite.initialize({ X_VISAGE_DATABASE: databasePath } as Env.Private);
      if (websites.length > 0) {
        await sqlite.insert($website).values(websites);
      }
      if (analyticsEvents.length > 0) {
        await sqlite.insert($analyticsEvent).values(analyticsEvents);
      }
      if (botEvents.length > 0) {
        await sqlite.insert($botEvent).values(botEvents);
      }
      if (tokens.length > 0) {
        await sqlite.insert($token).values(tokens);
      }
      sqlite.close();
      return databasePath;
    }
  }
}
