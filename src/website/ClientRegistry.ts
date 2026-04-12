import { Env } from "@/Env";
import { ProblemDetails } from "@/models/ProblemDetails";
import { Class } from "@/types/Class";
import { OmitBetter } from "@/types/OmitBetter";
import { createContext } from "react";
import { Yesttp } from "yesttp";
import { DialogClient } from "./clients/DialogClient";
import { RestrictedClient } from "./clients/RestrictedClient";
import { SocketClient } from "./clients/SocketClient";
import { StatsClient } from "./clients/StatsClient";
import { TokenClient } from "./clients/TokenClient";
import { WebsiteClient } from "./clients/WebsiteClient";

export class ClientRegistry {
  /**
   * There's always this catch-42 where you need the configuration URL in order to get the configuration.
   * With Bun, there's no build step, though, so we can always assume frontend + backend are served from the same domain.
   *
   * In other frameworks, we'd have to use a build-time variable containing the configuration URL.
   */
  public static async bootstrap(): Promise<ClientRegistry> {
    const { json: env } = await new Yesttp({ baseUrl: "/internal-api" }).get<Env.Public>("/env", { responseType: "json" });
    this.printEnv(env);
    return new ClientRegistry(env);
  }

  private static printEnv(env: Env.Public) {
    const envCopy: OmitBetter<Env.Public, "O_VISAGE_SUPPORTER"> = {
      O_VISAGE_STAGE: env.O_VISAGE_STAGE,
      O_VISAGE_VERSION: env.O_VISAGE_VERSION,
      O_VISAGE_COMMIT: env.O_VISAGE_COMMIT,
      O_VISAGE_TIMEZONE: env.O_VISAGE_TIMEZONE,
    };
    if (Object.entries(envCopy).length > 0) {
      const longestKey = Object.keys(envCopy)
        .map((k) => k.length)
        .reduce((l1, l2) => Math.max(l1, l2));
      let result = ``;
      Object.entries(envCopy).forEach(([key, value]) => {
        result += `${key.padEnd(longestKey + 1)}: ${value}\n`;
      });
      console.info("%cVisage\n\n%c%s", "font-size: 24px; font-weight: 800;", "font-size: 12px; font-weight: normal", result);
    }
  }

  private readonly registry: Record<string, any> = {};

  public constructor(private readonly env: Env.Public) {
    const yesttp = (this.registry[Yesttp.name] = new Yesttp({
      baseUrl: "/internal-api",
      responseErrorIntercepter: (_request, response): Promise<ProblemDetails> => {
        return Promise.reject(response.json);
      },
    }));
    this.registry[SocketClient.name] = new SocketClient();
    this.registry[DialogClient.name] = new DialogClient();
    this.registry[WebsiteClient.name] = new WebsiteClient(yesttp);
    this.registry[StatsClient.name] = new StatsClient(yesttp);
    this.registry[RestrictedClient.name] = new RestrictedClient(yesttp);
    this.registry[TokenClient.name] = new TokenClient(yesttp);
  }

  public getEnv() {
    return this.env;
  }

  public get<T>(klass: Class<T>): T {
    const result = this.registry[klass.name] as T;
    if (!result) {
      throw new Error(`No registration for ${klass.name}`);
    }
    return result;
  }
}

export namespace ClientRegistry {
  export const Context = createContext({} as ClientRegistry);
}
