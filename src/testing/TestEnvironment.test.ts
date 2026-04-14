import { Sqlite } from "@/drizzle/sqlite";
import { Env } from "@/Env";
import { EventBus } from "@/events/EventBus";
import { Logger } from "@/Logger";
import { LogLevel } from "@/models/LogLevel";
import { AnalyticsEventRepository } from "@/repositories/AnalyticsEventRepository";
import { TokenRepository } from "@/repositories/TokenRepository";
import { WebsiteRepository } from "@/repositories/WebsiteRepository";
import { BotDetectionService } from "@/services/BotDetectionService";
import { MaxMindGeoService } from "@/services/MaxMindGeoService";
import { TokenService } from "@/services/TokenService";
import { OmitBetter } from "@/types/OmitBetter";
import { jest, mock, Mock } from "bun:test";
import { mkdir, rm } from "fs/promises";
import { dirname, join } from "path";

export namespace TestEnvironment {
  type Mocked<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? Mock<T[K]> : never;
  } & {
    cast: () => T;
  };

  export interface Context {
    env: Env.Private;
    sqlite: Sqlite;
    patchEnvironmentVariables(environment: Record<string, string>): void;
    eventBus: EventBus;
    websiteRepository: WebsiteRepository;
    analyticsEventRepository: AnalyticsEventRepository;
    tokenRepository: TokenRepository;
    tokenServiceMock: Mocked<TokenService>;
    maxMindGeoServiceMock: Mocked<MaxMindGeoService>;
    botDetectionServiceMock: Mocked<BotDetectionService>;
  }

  const cleanupTasks: Array<() => unknown | Promise<unknown>> = [];
  const originalEnv = { ...Bun.env };

  export async function initialize(): Promise<Context> {
    // Cleanup between unit tests
    mock.restore();
    jest.clearAllMocks();
    jest.restoreAllMocks();
    Object.assign(Bun.env, originalEnv);
    while (cleanupTasks.length > 0) {
      const task = cleanupTasks.pop()!; // in reverse order = important!
      await task();
    }

    // Ensure we're running from the project root
    const cwd = await (async function ensureValidCwd(): Promise<string> {
      const cwd = process.cwd();
      const packageJsonPath = join(cwd, "package.json");
      const packageJsonFile = Bun.file(packageJsonPath);
      if (!(await packageJsonFile.exists())) {
        throw new Error(`Invalid working directory, package.json not found: ${packageJsonPath}`);
      }
      const { name } = await packageJsonFile.json();
      if (name !== "visage") {
        throw new Error(`Invalid working directory, invalid project name in package.json: ${name}`);
      }
      return cwd;
    })();

    // Setup env
    // We'd have to make this root unique (with a random part) to support parallel unit tests,
    // but Bun is so fast it's not needed
    const unitTestRoot = join(cwd, "opt", "unit-test");
    const env = Env.initialize("UTC", {
      O_VISAGE_STAGE: "development",
      O_VISAGE_TIMEZONE: "UTC",
      X_VISAGE_ROOT: join(unitTestRoot, "visage"),
      X_VISAGE_LOGGING: LogLevel.warn,
      X_VISAGE_VERIFICATION_KEY:
        "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAalpLQu9Fkn/R3WylORAad6UB0XAOowFIjF2/FwAyjpc=\n-----END PUBLIC KEY-----",
      X_VISAGE_ENABLE_RESTRICTED_ENTPOINTS: "false",
    });
    const patchEnvironmentVariables = (environment: Record<string, string>) => {
      Object.assign(Bun.env, environment);
    };

    // Initialize the logger
    Logger.initialize(env);

    // Setup filesystem
    await mkdir(dirname(env.X_VISAGE_DATABASE), { recursive: true });
    await rm(env.X_VISAGE_DATABASE, { force: true });

    // Setup SQLite
    const sqlite = await Sqlite.initialize(env);
    cleanupTasks.push(() => sqlite.close());

    // Mock registration
    function registerMockObject<T>(mockObject: OmitBetter<Mocked<T>, "cast">): Mocked<T> {
      const extra = { cast: () => mockObject as T } as Pick<Mocked<T>, "cast">;
      Object.assign(mockObject, extra);
      return mockObject as Mocked<T>;
    }

    // Dependencies
    const eventBus = new EventBus();
    const websiteRepository = new WebsiteRepository(sqlite);
    const tokenRepository = new TokenRepository(sqlite);
    const tokenServiceMock = registerMockObject<TokenService>({
      list: mock(),
      generate: mock(),
      validate: mock(),
      delete: mock(),
    });
    const analyticsEventRepository = new AnalyticsEventRepository(env, sqlite);
    const maxMindGeoServiceMock = registerMockObject<MaxMindGeoService>({
      lookup: mock(),
      keepDatabaseUpToDate: mock(),
    });
    const botDetectionServiceMock = registerMockObject<BotDetectionService>({
      isBot: mock(),
    });

    return {
      env,
      sqlite,
      patchEnvironmentVariables,
      eventBus,
      websiteRepository,
      analyticsEventRepository,
      tokenRepository,
      tokenServiceMock,
      maxMindGeoServiceMock,
      botDetectionServiceMock,
    };
  }
}
