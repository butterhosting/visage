import { Temporal } from "@js-temporal/polyfill";

export type AnalyticsEvent = {
  id: string;
  object: "analytics_event";
  created: Temporal.Instant;
  websiteId: string;
  clientPageId?: string;
  durationSeconds?: number;
  url: {
    hostname: string;
    path: string;
    queryString?: string;
  };
  referrer?: {
    hostname: string;
    path: string;
    queryString?: string;
  };
  isVisitor: boolean;
  userAgent: string;
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
  };
  window: {
    screenWidth: number;
    screenHeight: number;
    viewportWidth: number;
    viewportHeight: number;
  };
  device: {
    os?: string;
    browser?: string;
  };
  locale: {
    language?: string;
    region?: string;
  };
  geo: {
    countryCode?: string;
    cityName?: string;
  };
};
