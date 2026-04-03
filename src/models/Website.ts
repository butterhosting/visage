import { ZodParser } from "@/helpers/ZodParser";
import { Temporal } from "@js-temporal/polyfill";
import z from "zod/v4";

export type Website = {
  id: string;
  object: "website";
  created: Temporal.Instant;
  hostname: string;
};

export namespace Website {
  export const parse = ZodParser.forType<Website>()
    .ensureSchemaMatchesType(() =>
      z.object({
        id: z.uuid(),
        object: z.literal("website"),
        created: z.string().transform((t) => Temporal.Instant.from(t)),
        hostname: z.string(),
      }),
    )
    .ensureTypeMatchesSchema();
}
