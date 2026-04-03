import { Env } from "@/Env";
import { Exception } from "@/errors/exception/Exception";
import { ServerError } from "@/errors/ServerError";
import index from "@/website/index.html";
import { Temporal } from "@js-temporal/polyfill";
import { ErrorLike } from "bun";
import { Generate } from "./helpers/Generate";
import { Prettify } from "./helpers/Prettify";
import { Logger } from "./Logger";
import { Middleware } from "./middleware/Middleware";
import { Website } from "./models/Website";
import { IngestionService } from "./services/IngestionService";
import { RestrictedService } from "./services/RestrictedService";
import { StatsService } from "./services/StatsService";
import { TrackerService } from "./services/TrackerService";
import { WebsiteService } from "./services/WebsiteService";
import { Socket } from "./socket/Socket";
import { WebsiteRM } from "./models/WebsiteRM";

export class Server {
  private readonly log = new Logger(__filename);

  public constructor(
    private readonly env: Env.Private,
    private readonly websiteService: WebsiteService,
    private readonly restrictedService: RestrictedService,
    private readonly trackerService: TrackerService,
    private readonly ingestionService: IngestionService,
    private readonly statsService: StatsService,
    private readonly middleware: Middleware,
  ) {}

  public listen() {
    const server: Bun.Server<Socket.Context> = Bun.serve({
      development: this.env.O_VISAGE_STAGE === "development",
      /**
       * Websockets
       */
      fetch: this.handleFetch(async (request, server) => {
        const { pathname } = new URL(request.url);
        if (pathname === "/socket") {
          const context: Socket.Context = {
            clientId: Generate.shortRandomString(),
          };
          if (server.upgrade(request, { data: context })) {
            return new Response(null, { status: 200 });
          }
          return Response.json(ServerError.socket_upgrade_failed().json());
        }
        return Response.json(ServerError.route_not_found().json());
      }),
      websocket: {
        message: () => {
          // Ignore any incoming client messages
        },
        open: (socket) => {
          console.log("TODO; register socket in service(s)");
        },
        close: (socket) => {
          console.log("TODO; unregister socket in service(s)");
        },
      },
      routes: {
        /**
         * HTML/API fallbacks
         *
         * Unfortunately, no middleware/basic-auth on the HTMLBundle right now; see
         * https://github.com/oven-sh/bun/issues/17595#issuecomment-2965865078
         *
         * (the suggested "secret asset path" breaks my websocket, unfortunately)
         */
        "/*": index,
        "/api/*": this.handleRoute(() => {
          return Response.json(ServerError.route_not_found().json(), { status: 404 });
        }),
        "/internal-api/*": this.handleRoute(() => {
          return Response.json(ServerError.route_not_found().json(), { status: 404 });
        }),

        /**
         * Public script
         */
        "/vis.js": {
          GET: this.handleRoute(async () => {
            const script = await this.trackerService.getMinifiedScript();
            return new Response(script, {
              headers: {
                "content-type": "application/javascript",
              },
            });
          }),
        },

        /**
         * Public ingestion endpoint
         */
        "/i": {
          POST: this.handleRoute(async (request) => {
            const ip = server.requestIP(request);
            if (ip) {
              await this.ingestionService.ingest(ip.address, await request.json());
            }
            return new Response();
          }),
        },

        /**
         * Semi-publically-accessible API
         */
        "/api/stats": {
          GET: this.handleRoute(async (request) => {
            const stats = await this.statsService.query(this.searchParams(request), "unknown");
            return Response.json(stats);
          }),
        },

        /**
         * Env
         */
        "/internal-api/env": {
          GET: this.handleRoute(() => {
            const response = Object.entries(this.env)
              .filter(([key]) => key.startsWith("O_VISAGE_" satisfies Env.PublicPrefix))
              .map(([key, value]) => ({ [key]: value }))
              .reduce((kv1, kv2) => Object.assign({}, kv1, kv2), {});
            return Response.json(response as Env.Public);
          }),
        },

        /**
         * Websites
         */
        "/internal-api/websites": {
          GET: this.handleRoute(async () => {
            const websites: WebsiteRM[] = await this.websiteService.query();
            return Response.json(websites);
          }),
          POST: this.handleRoute(async (request) => {
            const website: Website = await this.websiteService.create(await request.json());
            return Response.json(website);
          }),
        },
        "/internal-api/websites/:ref": {
          GET: this.handleRoute(async ({ params }) => {
            const website: WebsiteRM = await this.websiteService.find(params.ref);
            return Response.json(website);
          }),
          POST: this.handleRoute(async (request) => {
            const website: Website = await this.websiteService.create(await request.json());
            return Response.json(website);
          }),
        },

        /**
         * Stats
         */
        "/internal-api/stats": {
          GET: this.handleRoute(async (request) => {
            const stats = await this.statsService.query(this.searchParams(request), "unknown");
            return Response.json(stats);
          }),
        },

        /**
         * Restricted endpoints for local and/or e2e testing
         */
        "/internal-api/restricted/purge": {
          POST: this.handleRoute(async () => {
            if (this.env.X_VISAGE_ENABLE_RESTRICTED_ENTPOINTS) {
              await this.restrictedService.purge();
              return new Response();
            }
            return Response.json(ServerError.route_not_found().json(), { status: 404 });
          }),
        },
        "/internal-api/restricted/seed": {
          POST: this.handleRoute(async () => {
            if (this.env.X_VISAGE_ENABLE_RESTRICTED_ENTPOINTS) {
              await this.restrictedService.seed();
              return new Response();
            }
            return Response.json(ServerError.route_not_found().json(), { status: 404 });
          }),
        },
      },

      /**
       * Error handling
       */
      error: (e) => this.handleError(e),
    });

    // ordinary log, so this is always printed (independent of log level)
    console.log(
      [
        "",
        `  🚀 \x1b[1mVisage started on ${Prettify.timestamp(Temporal.Now.instant(), this.env.O_VISAGE_TIMEZONE)} (${this.env.O_VISAGE_TIMEZONE})\x1b[0m`,
        "",
        `  \x1b[1mServer\x1b[0m    ${server.url}`,
        "",
        `  \x1b[1mStage\x1b[0m     ${this.env.O_VISAGE_STAGE}`,
        `  \x1b[1mCommit\x1b[0m    ${this.env.O_VISAGE_COMMIT}`,
        `  \x1b[1mVersion\x1b[0m   ${this.env.O_VISAGE_VERSION}`,
        "",
        `  \x1b[1mLogging\x1b[0m   ${this.env.X_VISAGE_LOGGING}`,
        `  \x1b[1mTimezone\x1b[0m  ${this.env.O_VISAGE_TIMEZONE}`,
        "",
        ...(this.env.O_VISAGE_SUPPORTER
          ? [
              `  \x1b[1mMode\x1b[0m      Running with love ❤️`, //
            ]
          : [
              `  \x1b[1mMode\x1b[0m      Running normally`, //
              `            https://butterhost.ing/visage/with-love`, //
            ]),
        "",
      ].join("\n"),
    );
  }

  private searchParams(request: Bun.BunRequest): Record<string, string> {
    const url = new URL(request.url);
    return Object.fromEntries(url.searchParams);
  }

  private searchParam<T extends `${string}!`>(request: Bun.BunRequest, name: T): string;
  private searchParam<T extends string>(request: Bun.BunRequest, name: T): string | undefined;
  private searchParam<T extends string>(request: Bun.BunRequest, nameWithPossibleExclamation: T): string | undefined {
    const url = new URL(request.url);
    const isRequired = nameWithPossibleExclamation.endsWith("!");
    const name = isRequired
      ? nameWithPossibleExclamation.substring(0, nameWithPossibleExclamation.length - 1)
      : nameWithPossibleExclamation;
    const value = url.searchParams.get(name);
    if (isRequired && !value) {
      throw ServerError.missing_query_parameter({ name });
    }
    return value || undefined;
  }

  private handleFetch<C>(
    fn: (request: Request, server: Bun.Server<C>) => Response | Promise<Response>,
  ): (request: Request, server: Bun.Server<C>) => Promise<Response> {
    return (request, server) =>
      this.middleware.handle(request, async () => {
        return await fn(request, server);
      });
  }

  private handleRoute<T extends string>(
    fn: (req: Bun.BunRequest<T>) => Response | Promise<Response>,
  ): (req: Bun.BunRequest<T>) => Promise<Response> {
    return (request) =>
      this.middleware.handle(request, async () => {
        return await fn(request);
      });
  }

  private async handleError(e: ErrorLike): Promise<Response> {
    if (Exception.isInstance(e)) {
      if (e.problem === "SERVER::unauthorized" || e.problem === "SERVER::forbidden") {
        return Response.json(e.json(), {
          status: 401,
          headers: { "www-authenticate": "basic" },
        });
      }
      return Response.json(e.json(), { status: 400 });
    }
    if (e.message?.includes("invalid input syntax for type")) {
      return Response.json(ServerError.invalid_request_body().json(), { status: 400 });
    }
    this.log.error("An unknown error occurred", e);
    return Response.json(ServerError.unknown().json(), { status: 500 });
  }
}
