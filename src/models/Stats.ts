import { DistributionPoint } from "./DistributionPoint";
import { TimeSeries } from "./TimeSeries";

export type Stats = Partial<{
  [Stats.Field.visitorsTotal]: number;
  [Stats.Field.pageviewsTotal]: number;
  [Stats.Field.durationMedian]: number;
  [Stats.Field.visitorsTimeSeries]: TimeSeries;
  [Stats.Field.pageviewsTimeSeries]: TimeSeries;
  [Stats.Field.durationTimeSeries]: TimeSeries;
  [Stats.Field.pathDistribution]: DistributionPoint[];
  [Stats.Field.sourceDistribution]: DistributionPoint[];
  [Stats.Field.screenDistribution]: DistributionPoint[];
  [Stats.Field.browserDistribution]: DistributionPoint[];
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
    durationTimeSeries = "durationTimeSeries",
    pathDistribution = "pathDistribution",
    sourceDistribution = "sourceDistribution",
    screenDistribution = "screenDistribution",
    browserDistribution = "browserDistribution",
    osDistribution = "osDistribution",
    countryDistribution = "countryDistribution",
    cityDistribution = "cityDistribution",
  }
}
