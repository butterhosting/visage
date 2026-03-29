import { AnalyticsEvent } from "@/models/AnalyticsEvent";

export class BotDetectionService {
  public async isBot(analyticsEvent: AnalyticsEvent): Promise<boolean> {
    return true;
  }
}
