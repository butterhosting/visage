import { ZodParser } from "@/helpers/ZodParser";
import z from "zod/v4";

export type DistributionPoint = {
  value: string | null;
  count: number;
};

export namespace DistributionPoint {
  export const parse = ZodParser.forType<DistributionPoint>()
    .ensureSchemaMatchesType(() =>
      z.object({
        value: z.string().nullable(),
        count: z.number(),
      }),
    )
    .ensureTypeMatchesSchema();
}
