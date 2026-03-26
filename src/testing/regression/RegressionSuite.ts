import * as schema from "@/drizzle/schema";
import { $analyticsEvent } from "@/drizzle/schema";
import { initializeSqlite, Sqlite } from "@/drizzle/sqlite";
import { Env } from "@/Env";
import { AnalyticsEventConverter } from "@/repositories/converters/AnalyticsEventConverter";
import { test } from "bun:test";
import { InferInsertModel } from "drizzle-orm";
import { join } from "path";

test.skip("regression suite management", async () => {
  // manually create a varied database file
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
      const overview: Record<keyof Tables, (sqlite: Sqlite) => Promise<unknown[]>> = {
        $analyticsEvent: (sqlite) =>
          sqlite.query.$analyticsEvent.findMany().then((records) => records.map(AnalyticsEventConverter.convert)),
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
      return await initializeSqlite({ X_VISAGE_DATABASE: databaseCopyPath } as Env.Private);
    }
    export async function insertIntoRegressionDatabase({ $analyticsEvent: analyticsEvents }: TableRecords) {
      const file = Bun.file(databasePath);
      if (await file.exists()) {
        await file.delete();
      }
      const sqlite = await initializeSqlite({ X_VISAGE_DATABASE: databasePath } as Env.Private);
      if (analyticsEvents.length > 0) {
        await sqlite.insert($analyticsEvent).values(analyticsEvents);
      }
      sqlite.close();
      return databasePath;
    }
  }
}
