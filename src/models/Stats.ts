import { DistributionPoint } from "./DistributionPoint";
import { TimeSeries } from "./TimeSeries";

export type Stats = Partial<{
  [Stats.Field.visitorsTotal]: number;
  [Stats.Field.pageviewsTotal]: number;
  [Stats.Field.durationMedian]: number;
  [Stats.Field.visitorsTimeSeries]: TimeSeries;
  [Stats.Field.pageviewsTimeSeries]: TimeSeries;
  [Stats.Field.pathDistribution]: DistributionPoint[];
  [Stats.Field.sourceDistribution]: DistributionPoint[];
  [Stats.Field.deviceDistribution]: DistributionPoint[];
  [Stats.Field.osDistribution]: DistributionPoint[];
  [Stats.Field.countryDistribution]: DistributionPoint[];
  [Stats.Field.cityDistribution]: DistributionPoint[];
}>;

export namespace Stats {
  export enum Field {
    visitorsTotal = "visitorsTotal",
    pageviewsTotal = "pageviewsTotal",
    durationMedian = "durationMedian",
    visitorsTimeSeries = "visitorsTimeSeries",
    pageviewsTimeSeries = "pageviewsTimeSeries",
    pathDistribution = "pathDistribution",
    sourceDistribution = "sourceDistribution",
    deviceDistribution = "deviceDistribution",
    osDistribution = "osDistribution",
    countryDistribution = "countryDistribution",
    cityDistribution = "cityDistribution",
  }
}
