import { ZodParser } from "@/helpers/ZodParser";
import z from "zod/v4";

export type BrowserTrackingEvent = BrowserTrackingEvent.Start | BrowserTrackingEvent.End;

export namespace BrowserTrackingEvent {
  export type Start = {
    /**
     * Type
     */
    t: "s";
    /**
     * ID
     */
    i: string;
    /**
     * URL
     */
    u: string;
    /**
     * Referrer
     */
    r?: string;
    /**
     * SPA count
     */
    sc: number;
    /**
     * User agent
     */
    ua: string;
    /**
     * Screen width
     */
    sw: number;
    /**
     * Screen height
     */
    sh: number;
    /**
     * Viewport width
     */
    vw: number;
    /**
     * Viewport height
     */
    vh: number;
    /**
     * Locale
     */
    l?: string;
  };

  export type End = {
    /**
     * Type
     */
    t: "e";
    /**
     * ID
     */
    i: string;
    /**
     * Duration (ms)
     */
    dms: number;
  };

  export const parse = ZodParser.forType<BrowserTrackingEvent>()
    .ensureSchemaMatchesType(() =>
      z.discriminatedUnion("t", [
        z.object({
          t: z.literal("s"),
          i: z.uuid(),
          u: z.url().max(2048),
          r: z.url().max(2048).optional(),
          sc: z.int().nonnegative().max(10_000),
          ua: z.string().max(1024),
          sw: z.int().nonnegative().max(10_000),
          sh: z.int().nonnegative().max(10_000),
          vw: z.int().nonnegative().max(10_000),
          vh: z.int().nonnegative().max(10_000),
          l: z.string().max(64).optional(),
        }),
        z.object({
          t: z.literal("e"),
          i: z.uuid(),
          dms: z.int().nonnegative().max(86_400_000),
        }),
      ]),
    )
    .ensureTypeMatchesSchema();
}
