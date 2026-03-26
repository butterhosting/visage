import { Temporal } from "@js-temporal/polyfill";
import { isAbsolute, join } from "path";
import { z } from "zod/v4";
import packageJson from "../package.json";
import { TimeZone } from "./helpers/TimeZone";
import { LogLevel } from "./models/LogLevel";
import { SupportToken } from "./support/SupportToken";

export namespace Env {
  const baseEnv = z.object({
    O_VISAGE_STAGE: z.enum(["development", "e2etest", "production"]),
    O_VISAGE_TIMEZONE: z.string().refine((tz) => TimeZone.check(tz), {
      error: "invalid_timezone",
    }),
    X_VISAGE_ROOT: z.string(),
    X_VISAGE_LOGGING: z.enum(LogLevel),
    X_VISAGE_SUPPORT_TOKEN: z.string().optional(),
    X_VISAGE_VERIFICATION_KEY: z.string().transform((str) => str.replaceAll("\\n", "\n")),
    X_VISAGE_ENABLE_RESTRICTED_ENTPOINTS: z.enum(["true", "false"]),
  });
  export function initialize(timezone = Temporal.Now.timeZoneId() as "UTC", environment = Bun.env as z.output<typeof baseEnv>) {
    if (timezone !== "UTC") {
      throw new Error(`Invalid timezone: ${timezone}`);
    }
    return baseEnv
      .transform(({ X_VISAGE_ROOT, X_VISAGE_SUPPORT_TOKEN, X_VISAGE_VERIFICATION_KEY, ...env }) => ({
        ...env,
        X_VISAGE_ROOT: isAbsolute(X_VISAGE_ROOT) ? X_VISAGE_ROOT : join(process.cwd(), X_VISAGE_ROOT),
        O_VISAGE_SUPPORTER: Boolean(SupportToken.verify({ hexToken: X_VISAGE_SUPPORT_TOKEN, publicKey: X_VISAGE_VERIFICATION_KEY })),
      }))
      .transform((env) => {
        const data = "data";
        return {
          ...env,
          O_VISAGE_COMMIT: packageJson.commit.slice(0, 7),
          O_VISAGE_VERSION: packageJson.version,
          X_VISAGE_HTPASSWD: join(env.X_VISAGE_ROOT, ".htpasswd"),
          X_VISAGE_DATA_ROOT: join(env.X_VISAGE_ROOT, data),
          X_VISAGE_DATABASE: join(env.X_VISAGE_ROOT, data, "db.sqlite"),
          X_VISAGE_ENABLE_RESTRICTED_ENTPOINTS: env.X_VISAGE_ENABLE_RESTRICTED_ENTPOINTS === "true",
        };
      })
      .parse(environment);
  }

  export type Private = ReturnType<typeof initialize>;

  export type Public = Readonly<{
    [K in keyof Private as K extends `${PublicPrefix}${string}` ? K : never]: Private[K] extends z.ZodTypeAny
      ? z.output<Private[K]>
      : Private[K];
  }>;
  export type PublicPrefix = "O_VISAGE_";
}
