import { ServerError } from "@/errors/ServerError";
import { ZodProblem } from "@/helpers/ZodIssues";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { BrowserPayload } from "@/models/BrowserPayload";
import { AnalyticsEventRepository } from "@/repositories/AnalyticsEventRepository";
import { Temporal } from "@js-temporal/polyfill";
import Bowser from "bowser";
import z from "zod/v4";

export class IngestionService {
  public constructor(private readonly analyticsEventRepository: AnalyticsEventRepository) {}

  public async ingest(ipAddress: string, unknown: BrowserPayload): Promise<void> {
    let payload: BrowserPayload;
    try {
      payload = BrowserPayload.parse(unknown);
    } catch (e) {
      throw ServerError.invalid_request_body(ZodProblem.issuesSummary(e as z.core.$ZodCatchCtx));
    }

    const url = new URL(payload.url);
    const referrerUrl = payload.referrer ? new URL(payload.referrer) : undefined;
    const analyticsEvent: AnalyticsEvent = {
      id: Bun.randomUUIDv7(),
      object: "analytics_event",
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
      isVisitor: (!referrerUrl || referrerUrl.hostname !== url.hostname) && payload.spaCount === 0,
      userAgent: payload.userAgent,
      utm: {
        source: url.searchParams.get("utm_source") ?? url.searchParams.get("source") ?? url.searchParams.get("ref") ?? undefined,
        medium: url.searchParams.get("utm_medium") ?? url.searchParams.get("medium") ?? undefined,
        campaign: url.searchParams.get("utm_campaign") ?? url.searchParams.get("campaign") ?? undefined,
        content: url.searchParams.get("utm_content") ?? url.searchParams.get("content") ?? undefined,
      },
      window: {
        screenWidth: payload.screenWidth,
        screenHeight: payload.screenHeight,
        viewportWidth: payload.viewportWidth,
        viewportHeight: payload.viewportHeight,
      },
      device: this.parseDevice(payload.userAgent),
      locale: this.parseLocale(payload.locale),
      geo: await this.deriveGeo(ipAddress),
    };
    console.log({ analyticsEvent });
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
    if (!locale) {
      return {};
    }
    const [language, region] = locale.split("-");
    return { language, region };
  }

  private async deriveGeo(ipAddress: string): Promise<AnalyticsEvent["geo"]> {
    // not implemented yet, but ignore this method (we'll tackle this later)
    // just assume it's available
    return {};
  }
}
