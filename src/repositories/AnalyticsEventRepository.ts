import { $analyticsEvent, $botEvent } from "@/drizzle/schema";
import { Sqlite } from "@/drizzle/sqlite";
import { Env } from "@/Env";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { and, eq, isNull, sql } from "drizzle-orm";
import { AnalyticsEventConverter } from "./converters/AnalyticsEventConverter";

export class AnalyticsEventRepository {
  private readonly maxBotEventTableSize: number;

  public constructor(
    env: Env.Private,
    private readonly sqlite: Sqlite,
  ) {
    this.maxBotEventTableSize = env.O_VISAGE_STAGE === "production" ? 10_000 : 10;
  }

  public async create(analyticsEvent: AnalyticsEvent, bot?: "bot"): Promise<void> {
    if (bot === "bot") {
      await this.sqlite.insert($botEvent).values({
        id: Bun.randomUUIDv7(),
        websiteId: analyticsEvent.websiteId,
        json: JSON.stringify(analyticsEvent),
      });
      await this.deleteOldestBotEvents();
    } else {
      const entity = AnalyticsEventConverter.convert(analyticsEvent);
      await this.sqlite.insert($analyticsEvent).values(entity).onConflictDoNothing();
    }
  }

  public async update(id: string, durationSeconds: number): Promise<void> {
    await this.sqlite
      .update($analyticsEvent)
      .set({ durationSeconds })
      .where(and(eq($analyticsEvent.id, id), isNull($analyticsEvent.durationSeconds)));
  }

  private async deleteOldestBotEvents(): Promise<void> {
    // below works because of UUIDv7
    this.sqlite.run(
      sql`delete from ${$botEvent} where ${$botEvent.id} not in (select ${$botEvent.id} from ${$botEvent} order by ${$botEvent.id} desc limit ${this.maxBotEventTableSize})`,
    );
  }
}
