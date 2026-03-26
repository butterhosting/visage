import { $analyticsEvent } from "@/drizzle/schema";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { Temporal } from "@js-temporal/polyfill";
import { InferSelectModel } from "drizzle-orm";

export namespace AnalyticsEventConverter {
  type $AnalyticsEvent = InferSelectModel<typeof $analyticsEvent>;

  export function convert(event: AnalyticsEvent): $AnalyticsEvent;
  export function convert(event: $AnalyticsEvent): AnalyticsEvent;
  export function convert(event: AnalyticsEvent | $AnalyticsEvent): AnalyticsEvent | $AnalyticsEvent {
    return "object" in event ? toDatabase(event) : fromDatabase(event);
  }

  function toDatabase(model: AnalyticsEvent): $AnalyticsEvent {
    return {
      id: model.id,
      created: model.created.toString(),
      urlHostname: model.url.hostname,
      urlPath: model.url.path,
      urlQueryString: model.url.queryString ?? null,
      referrerHostname: model.referrer?.hostname ?? null,
      referrerPath: model.referrer?.path ?? null,
      referrerQueryString: model.referrer?.queryString ?? null,
      isVisitor: model.isVisitor,
      userAgent: model.userAgent,
      utmSource: model.utm.source ?? null,
      utmMedium: model.utm.medium ?? null,
      utmCampaign: model.utm.campaign ?? null,
      utmContent: model.utm.content ?? null,
      windowScreenWidth: model.window.screenWidth,
      windowScreenHeight: model.window.screenHeight,
      windowViewportWidth: model.window.viewportWidth,
      windowViewportHeight: model.window.viewportHeight,
      deviceOsName: model.device.osName ?? null,
      deviceOsVersion: model.device.osVersion ?? null,
      deviceBrowserName: model.device.browserName ?? null,
      deviceBrowserVersion: model.device.browserVersion ?? null,
      localeLanguage: model.locale.language ?? null,
      localeRegion: model.locale.region ?? null,
      geoCountryCode: model.geo.countryCode ?? null,
      geoCity: model.geo.city ?? null,
    };
  }

  function fromDatabase(db: $AnalyticsEvent): AnalyticsEvent {
    return {
      id: db.id,
      object: "analytics_event",
      created: Temporal.Instant.from(db.created),
      url: {
        hostname: db.urlHostname,
        path: db.urlPath,
        queryString: db.urlQueryString ?? undefined,
      },
      referrer:
        db.referrerHostname !== null && db.referrerPath !== null
          ? {
              hostname: db.referrerHostname,
              path: db.referrerPath,
              queryString: db.referrerQueryString ?? undefined,
            }
          : undefined,
      isVisitor: db.isVisitor,
      userAgent: db.userAgent,
      utm: {
        source: db.utmSource ?? undefined,
        medium: db.utmMedium ?? undefined,
        campaign: db.utmCampaign ?? undefined,
        content: db.utmContent ?? undefined,
      },
      window: {
        screenWidth: db.windowScreenWidth,
        screenHeight: db.windowScreenHeight,
        viewportWidth: db.windowViewportWidth,
        viewportHeight: db.windowViewportHeight,
      },
      device: {
        osName: db.deviceOsName ?? undefined,
        osVersion: db.deviceOsVersion ?? undefined,
        browserName: db.deviceBrowserName ?? undefined,
        browserVersion: db.deviceBrowserVersion ?? undefined,
      },
      locale: {
        language: db.localeLanguage ?? undefined,
        region: db.localeRegion ?? undefined,
      },
      geo: {
        countryCode: db.geoCountryCode ?? undefined,
        city: db.geoCity ?? undefined,
      },
    };
  }
}
