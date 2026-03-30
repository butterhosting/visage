import { Temporal } from "@js-temporal/polyfill";

export type Website = {
  id: string;
  object: "website";
  created: Temporal.Instant;
  hostname: string;
};
