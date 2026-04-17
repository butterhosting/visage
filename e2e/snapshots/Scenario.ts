import { Temporal } from "@js-temporal/polyfill";

type Preset = "Today" | "Yesterday" | "Last 7 days" | "Last 30 days" | "Last 90 days" | "All time";
type Filter =
  | {
      type: "period";
      period: Preset | { from: Temporal.PlainDate; to: Temporal.PlainDate };
    }
  | {
      type: "distribution";
      distributionTab: string;
      value: string;
    };

export type Scenario = {
  name: string;
  rngSeed: number;
  filters: Filter[];
};
