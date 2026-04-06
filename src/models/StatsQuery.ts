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
  [StatsQuery.Filter.source]?: string | null;
  [StatsQuery.Filter.screen]?: string;
  [StatsQuery.Filter.browser]?: string | null;
  [StatsQuery.Filter.os]?: string | null;
  [StatsQuery.Filter.country]?: string | null;
  [StatsQuery.Filter.city]?: string | null;
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
        source: z
          .string()
          .transform((s) => (s === "@null" ? null : s)) // TODO: centralize this ...
          .optional(),
        screen: z.string().optional(),
        browser: z
          .string()
          .transform((s) => (s === "@null" ? null : s)) // TODO: centralize this ...
          .optional(),
        os: z
          .string()
          .transform((s) => (s === "@null" ? null : s)) // TODO: centralize this ...
          .optional(),
        country: z
          .string()
          .transform((s) => (s === "@null" ? null : s)) // TODO: centralize this ...
          .optional(),
        city: z
          .string()
          .transform((s) => (s === "@null" ? null : s)) // TODO: centralize this ...
          .optional(),
      }),
    )
    .ensureTypeMatchesSchema();
}
