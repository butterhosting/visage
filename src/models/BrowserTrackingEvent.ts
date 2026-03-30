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
          i: z.string(),
          u: z.string(),
          r: z.string().optional(),
          sc: z.number(),
          ua: z.string(),
          sw: z.number(),
          sh: z.number(),
          vw: z.number(),
          vh: z.number(),
          l: z.string().optional(),
        }),
        z.object({
          t: z.literal("e"),
          i: z.string(),
          dms: z.number(),
        }),
      ]),
    )
    .ensureTypeMatchesSchema();
}
