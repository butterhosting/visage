import { Temporal } from "@js-temporal/polyfill";

export type TimeSeries = {
  tUnit: "minute" | "hour" | "day" | "month";
  yUnit: "visitor" | "pageview" | "second";
  data: Array<{
    t: Temporal.Instant;
    y: number;
  }>;
};
