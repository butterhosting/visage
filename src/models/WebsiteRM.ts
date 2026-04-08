import { ZodParser } from "@/helpers/ZodParser";
import z from "zod/v4";
import { TimeSeries } from "./TimeSeries";
import { Website } from "./Website";

// read model
export type WebsiteRM = Website & {
  visitorsTotal30d: number;
  visitorsTimeSeries30d: TimeSeries;
};

export namespace WebsiteRM {
  export const parse = ZodParser.forType<WebsiteRM>()
    .ensureSchemaMatchesType(() =>
      Website.parse.SCHEMA.and(
        z.object({
          visitorsTotal30d: z.number(),
          visitorsTimeSeries30d: TimeSeries.parse.SCHEMA,
        }),
      ),
    )
    .ensureTypeMatchesSchema();
}
