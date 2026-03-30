import { $website } from "@/drizzle/schema";
import { Website } from "@/models/Website";
import { Temporal } from "@js-temporal/polyfill";
import { InferSelectModel } from "drizzle-orm";

export namespace WebsiteConverter {
  type $Website = InferSelectModel<typeof $website>;

  export function convert(website: Website): $Website;
  export function convert(website: $Website): Website;
  export function convert(website: Website | $Website): Website | $Website {
    return "object" in website ? toDatabase(website) : fromDatabase(website);
  }

  function toDatabase(model: Website): $Website {
    return {
      id: model.id,
      created: model.created.toString(),
      hostname: model.hostname,
    };
  }

  function fromDatabase(db: $Website): Website {
    return {
      id: db.id,
      object: "website",
      created: Temporal.Instant.from(db.created),
      hostname: db.hostname,
    };
  }
}
