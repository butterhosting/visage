import { WebsiteError } from "@/errors/WebsiteError";
import { Logger } from "@/Logger";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { BrowserTrackingEvent } from "@/models/BrowserTrackingEvent";
import { AnalyticsEventRepository } from "@/repositories/AnalyticsEventRepository";
import { WebsiteRepository } from "@/repositories/WebsiteRepository";
import { ServerMessage } from "@/socket/ServerMessage";
import { Socket } from "@/socket/Socket";
import { Temporal } from "@js-temporal/polyfill";
import Bowser from "bowser";
import { BotDetectionService } from "./BotDetectionService";
import { MaxMindGeoService } from "./MaxMindGeoService";

export class IngestionService {
  private readonly log = new Logger(__filename);

  private readonly sockets: Socket[] = [];
  private readonly socketNotificationHistory: Map<string, { t: Temporal.Instant; timeoutId?: NodeJS.Timeout }> = new Map();
  private readonly socketNotificationCooldown = Temporal.Duration.from({ milliseconds: 500 });

  public constructor(
    private readonly maxMindGeoService: MaxMindGeoService,
    private readonly botDetectionService: BotDetectionService,
    private readonly analyticsEventRepository: AnalyticsEventRepository,
    private readonly websiteRepository: WebsiteRepository,
  ) {}

  public registerSocket = (socket: Socket) => {
    this.sockets.push(socket);
  };

  public unregisterSocket = (socket: Socket) => {
    const index = this.sockets.findIndex((s) => s.data.clientId === socket.data.clientId);
    if (index >= 0) {
      this.sockets.splice(index, 1);
    }
  };

  private notifySockets = (websiteId: string) => {
    const now = Temporal.Now.instant();
    const previous = this.socketNotificationHistory.get(websiteId);

    const notify = () => {
      const message: ServerMessage = {
        type: ServerMessage.Type.website_stats_update,
        websiteId,
      };
      this.sockets.forEach((socket) => socket.send(JSON.stringify(message)));
    };

    if (previous) {
      const existingTimeout = Boolean(previous.timeoutId);
      if (!existingTimeout) {
        const elapsed = now.since(previous.t);
        const remainingWaitTime = this.socketNotificationCooldown.subtract(elapsed);
        if (remainingWaitTime.sign > 0) {
          previous.timeoutId = setTimeout(() => {
            previous.t = Temporal.Now.instant();
            previous.timeoutId = undefined;
            notify();
          }, remainingWaitTime.total("milliseconds"));
        } else {
          previous.t = now;
          previous.timeoutId = undefined;
          notify();
        }
      }
    } else {
      this.socketNotificationHistory.set(websiteId, { t: now });
      notify();
    }
  };

  public async ingest(ipAddress: string, unknown: BrowserTrackingEvent): Promise<void> {
    try {
      const event = BrowserTrackingEvent.parse(unknown);
      switch (event.t) {
        case "s": {
          await this.ingestStart(ipAddress, event).catch((err) => {
            this.log.debug("Failed to handle ingest START event", err);
          });
          return;
        }
        case "e": {
          await this.ingestEnd(event).catch((err) => {
            this.log.debug("Failed to handle ingest END event", err);
          });
          return;
        }
        default: {
          event satisfies never;
        }
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
    const isReentry = payload.nt === "reload" || payload.nt === "back_forward";
    const isVisitor = !isReentry && (!referrerUrl || referrerUrl.hostname !== url.hostname) && payload.sc === 0;
    const analyticsEvent: AnalyticsEvent = {
      id: Bun.randomUUIDv7(),
      object: "analytics_event",
      websiteId: website.id,
      clientPageId: payload.cpi,
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
      isVisitor,
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
      if (!website.hasData) {
        await this.websiteRepository.update(website.id, { hasData: true });
      }
    }
    this.notifySockets(analyticsEvent.websiteId);
  }

  private async ingestEnd(payload: BrowserTrackingEvent.End): Promise<void> {
    if (payload.dms > 0) {
      await this.analyticsEventRepository.update(payload.cpi, {
        durationSeconds: Temporal.Duration.from({ milliseconds: payload.dms }).round("seconds").total("seconds"),
      });
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
