import { ZodParser } from "@/helpers/ZodParser";
import z from "zod/v4";

export type BrowserTrackingEvent = BrowserTrackingEvent.Start | BrowserTrackingEvent.End;

export namespace BrowserTrackingEvent {
  export type Start = {
    type: "start";
    pageId: string;
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

  export type End = {
    type: "end";
    pageId: string;
    durationMs: number;
  };

  export const parse = ZodParser.forType<BrowserTrackingEvent>()
    .ensureSchemaMatchesType(() =>
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("start"),
          pageId: z.string(),
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
        z.object({
          type: z.literal("end"),
          pageId: z.string(),
          durationMs: z.number(),
        }),
      ]),
    )
    .ensureTypeMatchesSchema();
}
