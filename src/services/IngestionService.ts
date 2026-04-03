import { WebsiteError } from "@/errors/WebsiteError";
import { Logger } from "@/Logger";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { BrowserTrackingEvent } from "@/models/BrowserTrackingEvent";
import { AnalyticsEventRepository } from "@/repositories/AnalyticsEventRepository";
import { WebsiteRepository } from "@/repositories/WebsiteRepository";
import { Temporal } from "@js-temporal/polyfill";
import Bowser from "bowser";
import { BotDetectionService } from "./BotDetectionService";
import { MaxMindGeoService } from "./MaxMindGeoService";

export class IngestionService {
  private readonly log = new Logger(__filename);

  public constructor(
    private readonly maxMindGeoService: MaxMindGeoService,
    private readonly botDetectionService: BotDetectionService,
    private readonly analyticsEventRepository: AnalyticsEventRepository,
    private readonly websiteRepository: WebsiteRepository,
  ) {}

  public async ingest(ipAddress: string, unknown: BrowserTrackingEvent): Promise<void> {
    try {
      const event = BrowserTrackingEvent.parse(unknown);
      switch (event.t) {
        case "s":
          return await this.ingestStart(ipAddress, event);
        case "e":
          return await this.ingestEnd(event);
      }
    } catch (e) {
      this.log.debug("Failed to ingest tracking event", e);
    }
  }

  private async ingestStart(ipAddress: string, payload: BrowserTrackingEvent.Start): Promise<void> {
    const url = new URL(payload.u);
    const website = await this.websiteRepository.find(url.hostname, () =>
      WebsiteError.not_found({
        ref: url.hostname,
      }),
    );

    const referrerUrl = payload.r ? new URL(payload.r) : undefined;
    let classification: AnalyticsEvent["classification"] = "pageview";
    if ((!referrerUrl || referrerUrl.hostname !== url.hostname) && payload.sc === 0) {
      classification = "visitor";
    }

    const analyticsEvent: AnalyticsEvent = {
      id: payload.i,
      object: "analytics_event",
      websiteId: website.id,
      created: Temporal.Now.instant(),
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
      classification,
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
      await this.analyticsEventRepository.create(analyticsEvent, "bot");
    } else {
      await this.analyticsEventRepository.create(analyticsEvent);
    }
  }

  private async ingestEnd(payload: BrowserTrackingEvent.End): Promise<void> {
    if (payload.dms > 0) {
      await this.analyticsEventRepository.update(
        payload.i,
        Temporal.Duration.from({ milliseconds: payload.dms }).round("seconds").total("seconds"),
      );
    }
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
