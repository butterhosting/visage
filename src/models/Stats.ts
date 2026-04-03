import { ZodParser } from "@/helpers/ZodParser";
import { DistributionPoint } from "./DistributionPoint";
import { TimeSeries } from "./TimeSeries";
import z from "zod/v4";

export type Stats = Partial<{
  [Stats.Field.visitorsTotal]: number;
  [Stats.Field.pageviewsTotal]: number;
  [Stats.Field.durationMedian]: number;
  [Stats.Field.visitorsTimeSeries]: TimeSeries;
  [Stats.Field.pageviewsTimeSeries]: TimeSeries;
  [Stats.Field.durationTimeSeries]: TimeSeries;
  [Stats.Field.pageDistribution]: DistributionPoint[];
  [Stats.Field.sourceDistribution]: DistributionPoint[];
  [Stats.Field.screenDistribution]: DistributionPoint[];
  [Stats.Field.countryDistribution]: DistributionPoint[];
  [Stats.Field.cityDistribution]: DistributionPoint[];
  [Stats.Field.browserDistribution]: DistributionPoint[];
  [Stats.Field.osDistribution]: DistributionPoint[];
}>;

export namespace Stats {
  export enum Field {
    visitorsTotal = "visitorsTotal",
    pageviewsTotal = "pageviewsTotal",
    durationMedian = "durationMedian",
    visitorsTimeSeries = "visitorsTimeSeries",
    pageviewsTimeSeries = "pageviewsTimeSeries",
    durationTimeSeries = "durationTimeSeries",
    pageDistribution = "pageDistribution",
    sourceDistribution = "sourceDistribution",
    screenDistribution = "screenDistribution",
    countryDistribution = "countryDistribution",
    cityDistribution = "cityDistribution",
    browserDistribution = "browserDistribution",
    osDistribution = "osDistribution",
  }

  export const parse = ZodParser.forType<Stats>()
    .ensureSchemaMatchesType(() =>
      z.object({
        [Field.visitorsTotal]: z.number().optional(),
        [Field.pageviewsTotal]: z.number().optional(),
        [Field.durationMedian]: z.number().optional(),
        [Field.visitorsTimeSeries]: TimeSeries.parse.SCHEMA.optional(),
        [Field.pageviewsTimeSeries]: TimeSeries.parse.SCHEMA.optional(),
        [Field.durationTimeSeries]: TimeSeries.parse.SCHEMA.optional(),
        [Field.pageDistribution]: z.array(DistributionPoint.parse.SCHEMA).optional(),
        [Field.sourceDistribution]: z.array(DistributionPoint.parse.SCHEMA).optional(),
        [Field.screenDistribution]: z.array(DistributionPoint.parse.SCHEMA).optional(),
        [Field.browserDistribution]: z.array(DistributionPoint.parse.SCHEMA).optional(),
        [Field.osDistribution]: z.array(DistributionPoint.parse.SCHEMA).optional(),
        [Field.countryDistribution]: z.array(DistributionPoint.parse.SCHEMA).optional(),
        [Field.cityDistribution]: z.array(DistributionPoint.parse.SCHEMA).optional(),
      }),
    )
    .ensureTypeMatchesSchema();
}
