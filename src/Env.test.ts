import { LogLevel } from "@/models/LogLevel";
import { TestEnvironment } from "@/testing/TestEnvironment.test";
import { beforeEach, describe, expect, it } from "bun:test";
import { Env } from "./Env";

describe("Env", () => {
  const REQUIRED = {
    VISAGE_STAGE: "dev",
    VISAGE_ROOT: "/opt/visage",
    VISAGE_VERIFICATION_KEY: "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAalpLQu9Fkn/R3WylORAad6UB0XAOowFIjF2/FwAyjpc=\n-----END PUBLIC KEY-----",
  };

  beforeEach(async () => {
    await TestEnvironment.initialize();
  });

  it("should fall back to a default for what is unset or empty, and remember what was provided", () => {
    // given (an env file expands an unset variable to nothing, so empty counts as unset)
    const env = Env.initialize("UTC", { ...REQUIRED, VISAGE_LOGGING: "debug", VISAGE_TRUST_PROXY: "" });
    // then
    expect(env.VISAGE_LOGGING).toEqual(LogLevel.debug);
    expect(env.VISAGE_TRUST_PROXY).toEqual(false);
    expect(env.VISAGE_DEMO).toEqual(false);
    expect(env.VISAGE_TIMEZONE).toEqual("UTC");
    expect(env.VISAGE_PROVIDED).toEqual({ VISAGE_LOGGING: "debug" });
    const demo = Env.initialize("UTC", { ...REQUIRED, VISAGE_DEMO: "true" });
    expect(demo.VISAGE_DEMO).toEqual(true);
    expect(demo.VISAGE_DATABASE).toEqual(":memory:");
  });

  it("should only enable maxmind once both credentials are given", () => {
    // given
    const off = Env.initialize("UTC", { ...REQUIRED, VISAGE_MAXMIND_ACCOUNT_ID: "faye" });
    const on = Env.initialize("UTC", { ...REQUIRED, VISAGE_MAXMIND_ACCOUNT_ID: "faye", VISAGE_MAXMIND_LICENSE_KEY: "klogin" });
    // then
    expect(off.VISAGE_MAXMIND).toBeUndefined();
    expect(on.VISAGE_MAXMIND).toEqual({
      ROOT: "/opt/visage/maxmind",
      BASE_URL: "https://download.maxmind.com",
      ACCOUNT_ID: "faye",
      LICENSE_KEY: "klogin",
    });
  });

  it("should expose only the public keys", () => {
    // given
    const env = Env.initialize("UTC", { ...REQUIRED, VISAGE_MAXMIND_ACCOUNT_ID: "faye", VISAGE_MAXMIND_LICENSE_KEY: "klogin" });
    // then
    expect(Object.keys(Env.onlyPublic(env)).sort()).toEqual(["VISAGE_COMMIT", "VISAGE_DEMO", "VISAGE_STAGE", "VISAGE_SUPPORTER", "VISAGE_TIMEZONE", "VISAGE_VERSION"]);
  });
});
