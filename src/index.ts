import { mkdir } from "fs/promises";
import { dirname } from "path";
import { Sqlite } from "./drizzle/sqlite";
import { Env } from "./Env";
import { Logger } from "./Logger";
import { BasicAuthMiddleware } from "./middleware/basicauth/BasicAuthMiddleware";
import { Server } from "./Server";
import { ServerRegistry } from "./ServerRegistry";
import { MaxMindGeoService } from "./services/MaxMindGeoService";

/**
 * Initialize the env configuration
 */
const env = Env.initialize();

/**
 * Initialize the logger
 */
Logger.initialize(env);

/**
 * Create the main directories
 */
await Promise.all([
  mkdir(dirname(env.X_VISAGE_DATABASE), { recursive: true }),
  mkdir(dirname(env.X_VISAGE_TRACKER_SCRIPT), { recursive: true }),
  env.X_MAXMIND ? mkdir(env.X_MAXMIND.ROOT, { recursive: true }) : Promise.resolve(),
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
registry.get(Server).listen();
