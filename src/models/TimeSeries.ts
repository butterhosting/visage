import { Temporal } from "@js-temporal/polyfill";

export type TimeSeries = {
  unit: "minute" | "hour" | "day" | "month";
  data: Array<{
    value: number;
    timestamp: Temporal.Instant;
  }>;
};
