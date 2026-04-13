import { ZodParser } from "@/helpers/ZodParser";
import z from "zod/v4";

export type ServerMessage = ServerMessage.WebsiteStatsUpdate;

export namespace ServerMessage {
  export enum Type {
    website_stats_update = "website_stats_update",
  }

  export type WebsiteStatsUpdate = {
    type: Type.website_stats_update;
    websiteId: string;
  };

  export const parse = ZodParser.forType<ServerMessage>()
    .ensureSchemaMatchesType(() => {
      return z.union([
        z.object({
          type: z.literal(Type.website_stats_update),
          websiteId: z.string(),
        }),
      ]);
    })
    .ensureTypeMatchesSchema();
}
