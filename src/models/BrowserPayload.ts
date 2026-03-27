import { ZodParser } from "@/helpers/ZodParser";
import z from "zod/v4";

export type BrowserPayload = {
  url: string;
  referrer?: string;
  spaCount: number;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  locale?: string;
};

export namespace BrowserPayload {
  export const parse = ZodParser.forType<BrowserPayload>()
    .ensureSchemaMatchesType(() =>
      z.object({
        url: z.string(),
        referrer: z.string().optional(),
        spaCount: z.number(),
        userAgent: z.string(),
        screenWidth: z.number(),
        screenHeight: z.number(),
        viewportWidth: z.number(),
        viewportHeight: z.number(),
        locale: z.string().optional(),
      }),
    )
    .ensureTypeMatchesSchema();
}
