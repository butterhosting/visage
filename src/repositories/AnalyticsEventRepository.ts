import { $analyticsEvent, $botEvent } from "@/drizzle/schema";
import { Sqlite } from "@/drizzle/sqlite";
import { Env } from "@/Env";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { AnalyticsEventConverter } from "../drizzle/converters/AnalyticsEventConverter";

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
        id: analyticsEvent.id,
        created: analyticsEvent.created.toString(),
        websiteId: analyticsEvent.websiteId,
        json: JSON.stringify(analyticsEvent),
      });
      await this.deleteOldestBotEvents();
    } else {
      const entity = AnalyticsEventConverter.convert(analyticsEvent);
      await this.sqlite.insert($analyticsEvent).values(entity).onConflictDoNothing();
    }
  }

  public async update(clientPageId: string, { durationSeconds }: Pick<AnalyticsEvent, "durationSeconds">): Promise<void> {
    await this.sqlite
      .update($analyticsEvent)
      .set({ clientPageId: null, durationSeconds })
      // TODO: dual index on `website,created`
      // TODO: index on `client_page_id`
      // TODO: only allow updates if they occurred in the last 30d
      .where(and(eq($analyticsEvent.clientPageId, clientPageId), isNotNull($analyticsEvent.clientPageId)));
  }

  private async deleteOldestBotEvents(): Promise<void> {
    // below works because of UUIDv7
    this.sqlite.run(
      sql`delete from ${$botEvent} where ${$botEvent.id} not in (select ${$botEvent.id} from ${$botEvent} order by ${$botEvent.id} desc limit ${this.maxBotEventTableSize})`,
    );
  }
}
