import { Sqlite } from "@/drizzle/sqlite";

export class AnalyticsEventRepository {
  public constructor(private readonly sqlite: Sqlite) {}
}
