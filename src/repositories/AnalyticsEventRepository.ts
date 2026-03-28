import { Sqlite } from "@/drizzle/sqlite";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { AnalyticsEventConverter } from "./converters/AnalyticsEventConverter";
import { $analyticsEvent } from "@/drizzle/schema";

export class AnalyticsEventRepository {
  public constructor(private readonly sqlite: Sqlite) {}

  public async create(analyticsEvent: AnalyticsEvent): Promise<AnalyticsEvent> {
    const db = AnalyticsEventConverter.convert(analyticsEvent);
    await this.sqlite.insert($analyticsEvent).values(db);
    return analyticsEvent;
  }
}
