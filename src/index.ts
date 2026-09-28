import { mkdir } from "fs/promises";
import { dirname } from "path";
import { Sqlite } from "./drizzle/sqlite";
import { Env } from "./Env";
import { Logger } from "./Logger";
import { BasicAuthMiddleware } from "./middleware/basicauth/BasicAuthMiddleware";
import { Server } from "./Server";
import { ServerRegistry } from "./ServerRegistry";
import { MaxMindGeoService } from "./services/MaxMindGeoService";
import { RestrictedService } from "./services/RestrictedService";

/**
 * Initialize the logger
 */
Logger.initialize(Env.initialize.partiallyForLogger());

/**
 * Initialize the env configuration
 */
const env = Env.initialize();

/**
 * Create the main directories
 */
await Promise.all([
  env.INTERACTIVE_DEMO ? Promise.resolve() : mkdir(dirname(env.VISAGE_DATABASE), { recursive: true }),
  env.VISAGE_MAXMIND ? mkdir(env.VISAGE_MAXMIND.ROOT, { recursive: true }) : Promise.resolve(),
]);

/**
 * Initialize the database
 */
const sqlite = await Sqlite.initialize(env);

/**
 * Bootstrap the registry
 */
const registry = await ServerRegistry.bootstrap(env, sqlite);

/**
 * Initialize the application
 */
await registry.get(MaxMindGeoService).keepDatabaseUpToDate();
await registry.get(BasicAuthMiddleware).initializeFromDisk();
if (env.INTERACTIVE_DEMO) {
  await registry.get(RestrictedService).seedDemo();
}
registry.get(Server).listen();

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, async () => {
    await registry.get(Server).stop();
    sqlite.close();
    process.exit(0);
  });
}
