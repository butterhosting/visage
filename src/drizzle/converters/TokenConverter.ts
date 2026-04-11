import { Token } from "@/models/Token";
import { Temporal } from "@js-temporal/polyfill";
import { InferSelectModel } from "drizzle-orm";
import { $token } from "../tables/$token";

export namespace TokenConverter {
  type $Token = InferSelectModel<typeof $token>;

  export function convert(token: Token): $Token;
  export function convert(token: $Token): Token;
  export function convert(token: Token | $Token): Token | $Token {
    return "object" in token ? toDatabase(token) : fromDatabase(token);
  }

  function toDatabase(model: Token): $Token {
    return {
      id: model.id,
      created: model.created?.toString(),
      websites: model.websites === "*" ? "*" : model.websites.join(","),
      lastUsed: model.lastUsed?.toString() ?? null,
      secretHash: model.secretHash,
    };
  }

  function fromDatabase(db: $Token): Token {
    return {
      id: db.id,
      object: "token_internal",
      created: Temporal.Instant.from(db.created),
      websites: db.websites === "*" ? "*" : db.websites.split(","),
      lastUsed: db.lastUsed ? Temporal.Instant.from(db.lastUsed) : undefined,
      secretHash: db.secretHash,
    };
  }
}
