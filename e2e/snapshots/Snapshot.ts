import { OmitBetter } from "@/types/OmitBetter";
import { Scenario } from "./Scenario";

export type Snapshot = {
  scenario: Scenario;
  data: Snapshot.Data;
};

export namespace Snapshot {
  export const listDistributionTabs = () => {
    return ["PAGES", "TRAFFIC SOURCES", "COUNTRIES", "CITIES", "SCREENS", "BROWSERS", "OPERATING SYSTEMS"] as const;
  };

  export type AggregateStats = {
    totalVisitors: string;
    totalPageviews: string;
    medianTimeOnPage: string;
    livePageviews: string;
  };
  export type Data = {
    aggregates: OmitBetter<Snapshot.AggregateStats, "livePageviews">;
    distributions: Record<DistributionTab, DistributionRow[]>;
  };

  type DistributionTab = ReturnType<typeof listDistributionTabs>[number];
  type DistributionRow = [string, string, string]; // percentage, value, pvs
}
