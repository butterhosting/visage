import { ZodParser } from "@/helpers/ZodParser";
import { Temporal } from "@js-temporal/polyfill";
import z from "zod/v4";

export type TimeSeries = {
  tUnit: "hour" | "day" | "month";
  yUnit: "visitor" | "pageview" | "second";
  data: TimeSeries.Point[];
};

export namespace TimeSeries {
  export type Point = {
    t: Temporal.Instant;
    y: number;
  };

  export const parse = ZodParser.forType<TimeSeries>()
    .ensureSchemaMatchesType(() =>
      z.object({
        tUnit: z.literal(["hour", "day", "month"]),
        yUnit: z.literal(["visitor", "pageview", "second"]),
        data: z.array(
          z.object({
            t: z.string().transform((t) => Temporal.Instant.from(t)),
            y: z.number(),
          }),
        ),
      }),
    )
    .ensureTypeMatchesSchema();
}
