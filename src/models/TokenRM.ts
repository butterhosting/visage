import { Temporal } from "@js-temporal/polyfill";

// read model
export type TokenRM = {
  id: string;
  object: "token";
  created: Temporal.Instant;
  websites: string[] | "*";
  lastUsed?: Temporal.Instant;
  value?: string;
};
