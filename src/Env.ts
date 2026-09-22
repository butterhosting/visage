import { Temporal } from "@js-temporal/polyfill";
import { isAbsolute, join } from "path";
import { z } from "zod/v4";
import packageJson from "../package.json";
import { TimeZone } from "./helpers/TimeZone";
import { LogLevel } from "./models/LogLevel";
import { SupportToken } from "./support/SupportToken";
import { ExtractBetter } from "./types/ExtractBetter";

export namespace Env {
  export const Schema = z.object({
    VISAGE_STAGE: z.enum(["dev", "e2e", "prod"]),
    VISAGE_TIMEZONE: z.string().refine((tz) => TimeZone.check(tz), {
      error: "invalid_timezone",
    }),

    VISAGE_ROOT: z.string(),
    VISAGE_LOGGING: z.enum(LogLevel),
    VISAGE_TRUST_PROXY: z.enum(["true", "false"]),
    VISAGE_SUPPORT_TOKEN: z.string().optional(),
    VISAGE_VERIFICATION_KEY: z.string().transform((str) => str.replaceAll("\\n", "\n")),

    VISAGE_MAXMIND_BASE_URL: z.string(),
    VISAGE_MAXMIND_ACCOUNT_ID: z.string(),
    VISAGE_MAXMIND_LICENSE_KEY: z.string(),
  });

  export type Defaultable = ExtractBetter<
    keyof z.input<typeof Schema>,
    "VISAGE_TIMEZONE" | "VISAGE_LOGGING" | "VISAGE_TRUST_PROXY" | "VISAGE_MAXMIND_BASE_URL" | "VISAGE_MAXMIND_ACCOUNT_ID" | "VISAGE_MAXMIND_LICENSE_KEY"
  >;
  export const Defaults: Record<Defaultable, string> = {
    VISAGE_TIMEZONE: "UTC",
    VISAGE_LOGGING: "info",
    VISAGE_TRUST_PROXY: "false",
    VISAGE_MAXMIND_BASE_URL: "https://download.maxmind.com",
    VISAGE_MAXMIND_ACCOUNT_ID: "",
    VISAGE_MAXMIND_LICENSE_KEY: "",
  };

  export function initialize(timezone = Temporal.Now.timeZoneId() as "UTC", environment: Record<string, string | undefined> = Bun.env) {
    if (timezone !== "UTC") {
      throw new Error(`Invalid timezone: ${timezone}`);
    }
    const { provided, merged } = withDefaults(environment);
    return Schema.transform(({ VISAGE_ROOT, VISAGE_SUPPORT_TOKEN, VISAGE_VERIFICATION_KEY, ...env }) => ({
      ...env,
      VISAGE_ROOT: isAbsolute(VISAGE_ROOT) ? VISAGE_ROOT : join(process.cwd(), VISAGE_ROOT),
      VISAGE_SUPPORTER: Boolean(SupportToken.verify({ hexToken: VISAGE_SUPPORT_TOKEN, publicKey: VISAGE_VERIFICATION_KEY })),
    }))
      .transform(({ VISAGE_MAXMIND_BASE_URL, VISAGE_MAXMIND_ACCOUNT_ID, VISAGE_MAXMIND_LICENSE_KEY, ...env }) => ({
        ...env,
        VISAGE_COMMIT: packageJson.commit.slice(0, 7),
        VISAGE_VERSION: packageJson.version,
        VISAGE_HTPASSWD: join(env.VISAGE_ROOT, ".htpasswd"),
        VISAGE_DATABASE: join(env.VISAGE_ROOT, "data", "db.sqlite"),
        VISAGE_TRUST_PROXY: env.VISAGE_TRUST_PROXY === "true",
        // geolocation stays off until both credentials are given (an unset env var arrives as "")
        VISAGE_MAXMIND:
          VISAGE_MAXMIND_ACCOUNT_ID && VISAGE_MAXMIND_LICENSE_KEY
            ? {
                ROOT: join(env.VISAGE_ROOT, "maxmind"),
                BASE_URL: VISAGE_MAXMIND_BASE_URL,
                ACCOUNT_ID: VISAGE_MAXMIND_ACCOUNT_ID,
                LICENSE_KEY: VISAGE_MAXMIND_LICENSE_KEY,
              }
            : undefined,
        VISAGE_PROVIDED: provided,
      }))
      .parse(merged);
  }
  initialize.partiallyForLogger = (environment: Record<string, string | undefined> = Bun.env) => {
    const { merged } = withDefaults(environment);
    return Schema.partial()
      .required({
        VISAGE_TIMEZONE: true,
        VISAGE_LOGGING: true,
      })
      .parse(merged);
  };

  export type Private = ReturnType<typeof initialize>;
  export type Public = Readonly<Pick<Private, "VISAGE_STAGE" | "VISAGE_TIMEZONE" | "VISAGE_COMMIT" | "VISAGE_VERSION" | "VISAGE_SUPPORTER">>;
  export function onlyPublic(env: Private): Public {
    return {
      VISAGE_STAGE: env.VISAGE_STAGE,
      VISAGE_TIMEZONE: env.VISAGE_TIMEZONE,
      VISAGE_COMMIT: env.VISAGE_COMMIT,
      VISAGE_VERSION: env.VISAGE_VERSION,
      VISAGE_SUPPORTER: env.VISAGE_SUPPORTER,
    };
  }

  // v-- helper functions --v

  function withDefaults(environment: Record<string, string | undefined>) {
    const provided: Partial<Record<Defaultable, string>> = {};
    const merged = { ...environment };
    for (const key of Object.keys(Defaults) as Defaultable[]) {
      const value = environment[key];
      if (value) {
        provided[key] = value;
      } else {
        merged[key] = Defaults[key];
      }
    }
    return { provided, merged };
  }
}
