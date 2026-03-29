import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import Bowser from "bowser";

export class BotDetectionService {
  public async isBot(analyticsEvent: AnalyticsEvent): Promise<boolean> {
    const browser = Bowser.getParser(analyticsEvent.userAgent);
    return browser.getPlatformType(true) === "bot";
  }
}
