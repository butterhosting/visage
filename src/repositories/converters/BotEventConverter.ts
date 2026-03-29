import { $botEvent } from "@/drizzle/schema";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { InferSelectModel } from "drizzle-orm";

export namespace BotEventConverter {
  type $BotEvent = InferSelectModel<typeof $botEvent>;

  export function convert(model: AnalyticsEvent): $BotEvent {
    return {
      id: model.id,
      json: JSON.stringify(model),
    };
  }
}
