import { Website } from "@/models/Website";
import { Temporal } from "@js-temporal/polyfill";

export type Event =
  // websites
  Event.WebsiteCreated | Event.WebsiteUpdated | Event.WebsiteDeleted;

export namespace Event {
  export enum Type {
    website_created = "website_created",
    website_updated = "website_updated",
    website_deleted = "website_deleted",
  }

  type Instance<T extends Event.Type, D> = {
    id: string;
    object: "event";
    published: Temporal.Instant;
    type: T;
    data: D;
  };

  // websites
  export type WebsiteCreated = Instance<Event.Type.website_created, { website: Website }>;
  export type WebsiteUpdated = Instance<Event.Type.website_updated, { website: Website }>;
  export type WebsiteDeleted = Instance<Event.Type.website_deleted, { website: Website }>;
}
