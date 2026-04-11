import { Temporal } from "@js-temporal/polyfill";
import { randomBytes } from "crypto";

export type Token = {
  id: string;
  object: "token_internal";
  created: Temporal.Instant;
  websites: string[] | "*";
  lastUsed?: Temporal.Instant;
  secretHash: string;
  secretPlain?: string;
};

export namespace Token {
  export function generateId(): string {
    return randomBytes(2).toString("hex"); // always 4 chars
  }
  export function generateSecret(): string {
    return randomBytes(16).toString("hex"); // always 32 chars
  }
  export function split(plaintext: string): { id: string; secret: string } {
    return {
      id: plaintext.slice(0, 4),
      secret: plaintext.slice(4),
    };
  }
  export function combine(id: string, secret: string) {
    return `${id}${secret}`;
  }
}
