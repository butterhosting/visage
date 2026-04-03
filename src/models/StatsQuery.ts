import { ZodParser } from "@/helpers/ZodParser";
import { Temporal } from "@js-temporal/polyfill";
import z from "zod/v4";
import { Stats } from "./Stats";

export type StatsQuery = {
  website: string;
  fields: Stats.Field[];
  [StatsQuery.Filter.from]?: Temporal.Instant;
  [StatsQuery.Filter.to]?: Temporal.Instant;
  [StatsQuery.Filter.page]?: string;
  [StatsQuery.Filter.source]?: string;
  [StatsQuery.Filter.screen]?: string;
  [StatsQuery.Filter.browser]?: string;
  [StatsQuery.Filter.os]?: string;
  [StatsQuery.Filter.country]?: string;
  [StatsQuery.Filter.city]?: string;
};

export namespace StatsQuery {
  export enum Filter {
    from = "from",
    to = "to",
    page = "page",
    source = "source",
    screen = "screen",
    browser = "browser",
    os = "os",
    country = "country",
    city = "city",
  }
  export type StringFilter = Exclude<Filter, Filter.from | Filter.to>;
  export const parse = ZodParser.forType<StatsQuery>()
    .ensureSchemaMatchesType(() =>
      z.object({
        website: z.string(),
        fields: z
          .string()
          .transform((s) => s.split(",") as Stats.Field[])
          .refine((fields) => fields.every((f) => Object.values(Stats.Field).includes(f))),
        from: z
          .string()
          .transform((t) => Temporal.Instant.from(t))
          .optional(),
        to: z
          .string()
          .transform((t) => Temporal.Instant.from(t))
          .optional(),
        page: z.string().optional(),
        source: z.string().optional(),
        screen: z.string().optional(),
        browser: z.string().optional(),
        os: z.string().optional(),
        country: z.string().optional(),
        city: z.string().optional(),
      }),
    )
    .ensureTypeMatchesSchema();
}
