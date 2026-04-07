import { ZodParser } from "@/helpers/ZodParser";
import z from "zod/v4";

export type Distribution = {
  limit: number;
  offset: number;
  hasMore: boolean;
  data: Array<{
    value: string | null;
    count: number;
    meta?: Record<string, string | number | boolean | null>;
  }>;
};

export namespace Distribution {
  export const parse = ZodParser.forType<Distribution>()
    .ensureSchemaMatchesType(() =>
      z.object({
        limit: z.number(),
        offset: z.number(),
        hasMore: z.boolean(),
        data: z.array(
          z.object({
            value: z.string().nullable(),
            count: z.number(),
            meta: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
          }),
        ),
      }),
    )
    .ensureTypeMatchesSchema();
}
