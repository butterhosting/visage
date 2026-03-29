import { $analyticsEvent, $botEvent } from "@/drizzle/schema";
import { Sqlite } from "@/drizzle/sqlite";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { Temporal } from "@js-temporal/polyfill";
import { and, eq, isNull, sql } from "drizzle-orm";
import { AnalyticsEventConverter } from "./converters/AnalyticsEventConverter";
import { BotEventConverter } from "./converters/BotEventConverter";

export class AnalyticsEventRepository {
  public constructor(private readonly sqlite: Sqlite) {}

  public async create(analyticsEvent: AnalyticsEvent, bot?: "bot"): Promise<void> {
    if (bot === "bot") {
      const entity = BotEventConverter.convert(analyticsEvent);
      await this.sqlite.insert($botEvent).values(entity);
      await this.deleteOldestBotEvents(10);
    } else {
      const entity = AnalyticsEventConverter.convert(analyticsEvent);
      await this.sqlite.insert($analyticsEvent).values(entity);
    }
  }

  public async update(pageId: string, duration: Temporal.Duration): Promise<void> {
    await this.sqlite
      .update($analyticsEvent)
      .set({ pageDurationMs: duration.total("milliseconds") })
      .where(and(eq($analyticsEvent.pageId, pageId), isNull($analyticsEvent.pageDurationMs)));
  }

  private async deleteOldestBotEvents(limit: number): Promise<void> {
    // below works because of UUIDv7
    this.sqlite.run(
      sql`delete from ${$botEvent} where ${$botEvent.id} not in (select ${$botEvent.id} from ${$botEvent} order by ${$botEvent.id} desc limit ${limit})`,
    );
  }
}
