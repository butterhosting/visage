import { ZodParser } from "@/helpers/ZodParser";
import { TimeSeries } from "./TimeSeries";
import { Website } from "./Website";
import z from "zod/v4";

// read model
export type WebsiteRM = Website & {
  visitorsTimeSeries30d: TimeSeries;
};

export namespace WebsiteRM {
  export const parse = ZodParser.forType<WebsiteRM>()
    .ensureSchemaMatchesType(() =>
      Website.parse.SCHEMA.and(
        z.object({
          visitorsTimeSeries30d: TimeSeries.parse.SCHEMA,
        }),
      ),
    )
    .ensureTypeMatchesSchema();
}
