import { initializeSqlite, Sqlite } from "@/drizzle/sqlite";
import { Env } from "@/Env";
import { Logger } from "@/Logger";
import { LogLevel } from "@/models/LogLevel";
import { AnalyticsEventRepository } from "@/repositories/AnalyticsEventRepository";
import { OmitBetter } from "@/types/OmitBetter";
import { jest, mock, Mock } from "bun:test";
import { mkdir } from "fs/promises";
import { join } from "path";

export namespace TestEnvironment {
  type Mocked<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? Mock<T[K]> : never;
  } & {
    cast: () => T;
  };

  export interface Context {
    env: Env.Private;
    sqlite: Sqlite;
    analyticsEventRepository: AnalyticsEventRepository;
    analyticsEventRepositoryMock: Mocked<AnalyticsEventRepository>;
    patchEnvironmentVariables(environment: Record<string, string>): void;
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

    // Initialize the logger
    Logger.initialize(env);

    // Setup filesystem
    await mkdir(env.X_VISAGE_DATA_ROOT, { recursive: true });

    // Setup SQLite
    const sqlite = await initializeSqlite(env);
    cleanupTasks.push(() => sqlite.close());

    // Mock registration
    function registerMockObject<T>(mockObject: OmitBetter<Mocked<T>, "cast">): Mocked<T> {
      const extra = { cast: () => mockObject as T } as Pick<Mocked<T>, "cast">;
      Object.assign(mockObject, extra);
      return mockObject as Mocked<T>;
    }

    // Dependencies
    const analyticsEventRepository = new AnalyticsEventRepository(sqlite);
    const analyticsEventRepositoryMock = registerMockObject<AnalyticsEventRepository>({
      create: mock(),
    });

    function patchEnvironmentVariables(environment: Record<string, string>) {
      Object.assign(Bun.env, environment);
    }

    return {
      env,
      sqlite,
      analyticsEventRepository,
      analyticsEventRepositoryMock,
      patchEnvironmentVariables,
    };
  }
}
