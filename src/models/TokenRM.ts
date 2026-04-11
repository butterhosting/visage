import { ZodParser } from "@/helpers/ZodParser";
import { Temporal } from "@js-temporal/polyfill";
import z from "zod/v4";

// read model
export type TokenRM = {
  id: string;
  object: "token";
  created: Temporal.Instant;
  websites: string[] | "*";
  lastUsed?: Temporal.Instant;
  value?: string;
};

export namespace TokenRM {
  export const parse = ZodParser.forType<TokenRM>()
    .ensureSchemaMatchesType(() =>
      z.object({
        id: z.string(),
        object: z.literal("token"),
        created: z.string().transform((t) => Temporal.Instant.from(t)),
        websites: z.union([z.literal("*"), z.array(z.string())]),
        lastUsed: z
          .string()
          .transform((t) => Temporal.Instant.from(t))
          .optional(),
        value: z.string().optional(),
      }),
    )
    .ensureTypeMatchesSchema();
}
