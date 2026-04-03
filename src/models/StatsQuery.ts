import { ZodParser } from "@/helpers/ZodParser";
import { Temporal } from "@js-temporal/polyfill";
import z from "zod/v4";
import { Stats } from "./Stats";

export type StatsQuery = {
  website: string;
  fields: Stats.Field[];
  from?: Temporal.Instant;
  to?: Temporal.Instant;
  path?: string;
  source?: string;
  device?: string;
  os?: string;
  country?: string;
  city?: string;
};

export namespace StatsQuery {
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
          .transform((s) => Temporal.Instant.from(s))
          .optional(),
        to: z
          .string()
          .transform((s) => Temporal.Instant.from(s))
          .optional(),
        path: z.string().optional(),
        source: z.string().optional(),
        device: z.string().optional(),
        os: z.string().optional(),
        country: z.string().optional(),
        city: z.string().optional(),
      }),
    )
    .ensureTypeMatchesSchema();
}
