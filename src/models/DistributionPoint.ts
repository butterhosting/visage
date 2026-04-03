import { ZodParser } from "@/helpers/ZodParser";
import z from "zod/v4";

export type DistributionPoint = {
  label: string;
  value: number;
};

export namespace DistributionPoint {
  export const parse = ZodParser.forType<DistributionPoint>()
    .ensureSchemaMatchesType(() =>
      z.object({
        label: z.string(),
        value: z.number(),
      }),
    )
    .ensureTypeMatchesSchema();
}
