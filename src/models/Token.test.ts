import { describe, expect, it } from "bun:test";
import { Temporal } from "@js-temporal/polyfill";
import { Token } from "./Token";

describe("Token", () => {
  it("combines and splits tokens", () => {
    for (let _ = 0; _ < 100; _++) {
      // given
      const originalId = Token.generateId();
      const originalSecret = Token.generateSecret();
      // when
      const { id, secret } = Token.split(Token.combine(originalId, originalSecret));
      // then
      expect(id).toEqual(originalId);
      expect(secret).toEqual(originalSecret);
    }
  });
});
