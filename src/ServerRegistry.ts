import { Class } from "@/types/Class";
import { Sqlite } from "./drizzle/sqlite";
import { Env } from "./Env";
import { BasicAuthMiddleware } from "./middleware/basicauth/BasicAuthMiddleware";
import { LoggingMiddleware } from "./middleware/basicauth/LoggingMiddleware";
import { Middleware } from "./middleware/Middleware";
import { AnalyticsEventRepository } from "./repositories/AnalyticsEventRepository";
import { Server } from "./Server";
import { IngestionService } from "./services/IngestionService";
import { RestrictedService } from "./services/RestrictedService";

export class ServerRegistry {
  public static async bootstrap(env: Env.Private, sqlite: Sqlite): Promise<ServerRegistry> {
    return new ServerRegistry(env, sqlite);
  }

  private readonly registry: Record<string, any> = {};

  private constructor(
    private readonly env: Env.Private,
    private readonly sqlite: Sqlite,
  ) {
    // Repositories
    const { analyticsEventRepository } = this.register({ AnalyticsEventRepository }, [sqlite]);

    // Services
    const { ingestionService } = this.register({ IngestionService }, [analyticsEventRepository]);
    const { restrictedService } = this.register({ RestrictedService }, []);

    // Middleware
    const { loggingMiddleware } = this.register({ LoggingMiddleware }, []);
    const { basicAuthMiddleware } = this.register({ BasicAuthMiddleware }, [env]);
    const { middleware } = this.register({ Middleware }, [loggingMiddleware, basicAuthMiddleware]);

    // Server
    this.register({ Server }, [env, ingestionService, restrictedService, middleware]);
  }

  public get(sqlite: "sqlite"): Sqlite;
  public get(env: "env"): Env.Private;
  public get<T>(klass: Class<T>): T;
  public get<T>(klass: "sqlite" | "env" | Class<T>): Sqlite | Env.Private | T {
    if (klass === "sqlite") {
      return this.sqlite;
    }
    if (klass === "env") {
      return this.env;
    }
    const result = this.registry[klass.name] as T;
    if (!result) {
      throw new Error(`No registration for ${klass.name}`);
    }
    return result;
  }

  private register<N extends string, C extends Class>(
    classRecord: Record<N, C>,
    parameters: ConstructorParameters<C>,
  ): Record<Uncapitalize<N>, InstanceType<C>> {
    const entry = Object.entries(classRecord).at(0)!;
    const name = entry[0] as N;
    const Klass = entry[1] as C;
    const instance: InstanceType<C> = new Klass(...parameters);
    this.registry[Klass.name] = instance;
    return {
      [`${name[0].toLowerCase()}${name.slice(1)}`]: instance,
    } as Record<Uncapitalize<N>, InstanceType<C>>;
  }
}
