import { $analyticsEvent } from "@/drizzle/schema";
import { Sqlite } from "@/drizzle/sqlite";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { Temporal } from "@js-temporal/polyfill";
import { and, eq, isNull } from "drizzle-orm";
import { AnalyticsEventConverter } from "./converters/AnalyticsEventConverter";

export class AnalyticsEventRepository {
  public constructor(private readonly sqlite: Sqlite) {}

  public async create(analyticsEvent: AnalyticsEvent): Promise<void> {
    const entity = AnalyticsEventConverter.convert(analyticsEvent);
    await this.sqlite.insert($analyticsEvent).values(entity);
  }

  public async update(pageId: string, duration: Temporal.Duration): Promise<void> {
    await this.sqlite
      .update($analyticsEvent)
      .set({ pageDurationMs: duration.total("milliseconds") })
      .where(and(eq($analyticsEvent.pageId, pageId), isNull($analyticsEvent.pageDurationMs)));
  }
}
