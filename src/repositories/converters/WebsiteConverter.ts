import { $website } from "@/drizzle/schema";
import { Website } from "@/models/Website";
import { Temporal } from "@js-temporal/polyfill";
import { InferSelectModel } from "drizzle-orm";

export namespace WebsiteConverter {
  type $Website = InferSelectModel<typeof $website>;

  export function convert(website: Website): $Website;
  export function convert(website: $Website): Website;
  export function convert(website: Partial<Website>): Partial<$Website>;
  export function convert(website: Partial<$Website>): Partial<Website>;
  export function convert(website: Partial<Website> | Partial<$Website>): Partial<Website> | Partial<$Website> {
    return "object" in website ? toDatabase(website) : fromDatabase(website as $Website);
  }

  function toDatabase(model: Partial<Website>): Partial<$Website> {
    return {
      id: model.id,
      created: model.created?.toString(),
      hostname: model.hostname,
      hasData: model.hasData,
    };
  }

  function fromDatabase(db: Partial<$Website>): Partial<Website> {
    return {
      id: db.id,
      object: "website",
      created: db.created ? Temporal.Instant.from(db.created) : undefined,
      hostname: db.hostname,
      hasData: db.hasData,
    };
  }
}
