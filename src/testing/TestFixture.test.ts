import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { Temporal } from "@js-temporal/polyfill";

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export namespace TestFixture {
  export function createAnalyticsEvent(overrides: DeepPartial<AnalyticsEvent> = {}): AnalyticsEvent {
    const defaults: AnalyticsEvent = {
      id: Bun.randomUUIDv7(),
      object: "analytics_event",
      created: Temporal.Now.instant(),
      url: {
        hostname: "example.com",
        path: "/hello",
      },
      referrer: {
        hostname: "news.ycombinator.com",
        path: "/",
      },
      isVisitor: false,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      utm: {},
      window: {
        screenWidth: 3840,
        screenHeight: 2160,
        viewportWidth: 1512,
        viewportHeight: 982,
      },
      device: {
        osName: "macOS",
        osVersion: "10.15.7",
        browserName: "Chrome",
        browserVersion: "146",
      },
      locale: {
        language: "de",
        region: "DE",
      },
      geo: {
        countryCode: "DE",
        cityName: "Berlin",
      },
    };
    return deepMerge(defaults, overrides);
  }

  function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
  }

  function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
    const result = { ...target } as Record<string, unknown>;
    for (const key in source) {
      const sourceVal = (source as Record<string, unknown>)[key];
      const targetVal = result[key];
      if (sourceVal !== undefined) {
        if (isPlainObject(targetVal) && isPlainObject(sourceVal)) {
          result[key] = deepMerge(targetVal, sourceVal);
        } else {
          result[key] = sourceVal;
        }
      }
    }
    return result as T;
  }
}
