import { ZodParser } from "@/helpers/ZodParser";
import { Distribution } from "./Distribution";
import { TimeSeries } from "./TimeSeries";
import z from "zod/v4";

export type Stats = Partial<{
  [Stats.Field.visitorsTotal]: number;
  [Stats.Field.pageviewsTotal]: number;
  [Stats.Field.pagetimeMedian]: number;
  [Stats.Field.livePageviewsTotal]: number;
  [Stats.Field.visitorsTimeSeries]: TimeSeries;
  [Stats.Field.pageviewsTimeSeries]: TimeSeries;
  [Stats.Field.pagetimeTimeSeries]: TimeSeries;
  [Stats.Field.pageDistribution]: Distribution;
  [Stats.Field.sourceDistribution]: Distribution;
  [Stats.Field.screenDistribution]: Distribution;
  [Stats.Field.countryDistribution]: Distribution;
  [Stats.Field.cityDistribution]: Distribution;
  [Stats.Field.browserDistribution]: Distribution;
  [Stats.Field.osDistribution]: Distribution;
}>;

export namespace Stats {
  export enum Field {
    visitorsTotal = "visitorsTotal",
    pageviewsTotal = "pageviewsTotal",
    pagetimeMedian = "pagetimeMedian",
    livePageviewsTotal = "livePageviewsTotal",
    visitorsTimeSeries = "visitorsTimeSeries",
    pageviewsTimeSeries = "pageviewsTimeSeries",
    pagetimeTimeSeries = "pagetimeTimeSeries",
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
        [Field.pagetimeMedian]: z.number().optional(),
        [Field.livePageviewsTotal]: z.number().optional(),
        [Field.visitorsTimeSeries]: TimeSeries.parse.SCHEMA.optional(),
        [Field.pageviewsTimeSeries]: TimeSeries.parse.SCHEMA.optional(),
        [Field.pagetimeTimeSeries]: TimeSeries.parse.SCHEMA.optional(),
        [Field.pageDistribution]: Distribution.parse.SCHEMA.optional(),
        [Field.sourceDistribution]: Distribution.parse.SCHEMA.optional(),
        [Field.screenDistribution]: Distribution.parse.SCHEMA.optional(),
        [Field.browserDistribution]: Distribution.parse.SCHEMA.optional(),
        [Field.osDistribution]: Distribution.parse.SCHEMA.optional(),
        [Field.countryDistribution]: Distribution.parse.SCHEMA.optional(),
        [Field.cityDistribution]: Distribution.parse.SCHEMA.optional(),
      }),
    )
    .ensureTypeMatchesSchema();
}
