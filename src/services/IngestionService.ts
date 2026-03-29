import { Logger } from "@/Logger";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { BrowserTrackingEvent } from "@/models/BrowserTrackingEvent";
import { AnalyticsEventRepository } from "@/repositories/AnalyticsEventRepository";
import { Temporal } from "@js-temporal/polyfill";
import Bowser from "bowser";
import { BotDetectionService } from "./BotDetectionService";
import { MaxMindGeoService } from "./MaxMindGeoService";

export class IngestionService {
  private readonly log = new Logger(__filename);

  public constructor(
    private readonly maxMindGeoService: MaxMindGeoService,
    private readonly botDetectionService: BotDetectionService,
    private readonly repository: AnalyticsEventRepository,
  ) {}

  public async ingest(ipAddress: string, unknown: BrowserTrackingEvent): Promise<void> {
    try {
      const event = BrowserTrackingEvent.parse(unknown);
      switch (event.t) {
        case "s":
          return this.ingestStart(ipAddress, event);
        case "e":
          return this.ingestEnd(event);
      }
    } catch (e) {
      this.log.debug("Failed to ingest tracking event", e);
    }
  }

  private async ingestStart(ipAddress: string, payload: BrowserTrackingEvent.Start): Promise<void> {
    const url = new URL(payload.u);
    const referrerUrl = payload.r ? new URL(payload.r) : undefined;
    const spaCount = payload.sc;
    const analyticsEvent: AnalyticsEvent = {
      id: Bun.randomUUIDv7(),
      object: "analytics_event",
      created: Temporal.Now.instant(),
      pageId: payload.pi,
      url: {
        hostname: url.hostname,
        path: url.pathname,
        queryString: url.search.slice(1) || undefined,
      },
      referrer: referrerUrl
        ? {
            hostname: referrerUrl.hostname,
            path: referrerUrl.pathname,
            queryString: referrerUrl.search.slice(1) || undefined,
          }
        : undefined,
      isVisitor: (!referrerUrl || referrerUrl.hostname !== url.hostname) && spaCount === 0,
      userAgent: payload.ua,
      utm: {
        source: url.searchParams.get("utm_source") ?? url.searchParams.get("source") ?? url.searchParams.get("ref") ?? undefined,
        medium: url.searchParams.get("utm_medium") ?? url.searchParams.get("medium") ?? undefined,
        campaign: url.searchParams.get("utm_campaign") ?? url.searchParams.get("campaign") ?? undefined,
        content: url.searchParams.get("utm_content") ?? url.searchParams.get("content") ?? undefined,
      },
      window: {
        screenWidth: payload.sw,
        screenHeight: payload.sh,
        viewportWidth: payload.vw,
        viewportHeight: payload.vh,
      },
      device: this.parseDevice(payload.ua),
      locale: this.parseLocale(payload.l),
      geo: await this.maxMindGeoService.lookup(ipAddress),
    };
    if (await this.botDetectionService.isBot(analyticsEvent)) {
      await this.repository.create(analyticsEvent, "bot");
    } else {
      await this.repository.create(analyticsEvent);
    }
  }

  private async ingestEnd(payload: BrowserTrackingEvent.End): Promise<void> {
    await this.repository.update(payload.pi, Temporal.Duration.from({ milliseconds: payload.d }));
  }

  private parseDevice(userAgent: string): AnalyticsEvent["device"] {
    const { os, browser } = Bowser.parse(userAgent);
    return {
      osName: os.name,
      osVersion: os.version,
      browserName: browser.name,
      browserVersion: browser.version,
    };
  }

  private parseLocale(locale: string | undefined): AnalyticsEvent["locale"] {
    if (locale) {
      const [language, region] = locale.split("-");
      return { language, region };
    }
    return {};
  }
}
