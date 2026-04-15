import { Env } from "@/Env";
import { Exception } from "@/errors/exception/Exception";
import { ServerError } from "@/errors/ServerError";
import index from "@/website/index.html";
import { Temporal } from "@js-temporal/polyfill";
import { ErrorLike } from "bun";
import { randomUUID } from "crypto";
import { Prettify } from "./helpers/Prettify";
import { Logger } from "./Logger";
import { Middleware } from "./middleware/Middleware";
import { TokenRM } from "./models/TokenRM";
import { Website } from "./models/Website";
import { WebsiteRM } from "./models/WebsiteRM";
import { ServerEndpoint } from "./ServerEndpoint";
import { ExportService } from "./services/ExportService";
import { IngestionService } from "./services/IngestionService";
import { RestrictedService } from "./services/RestrictedService";
import { StatsService } from "./services/StatsService";
import { TokenService } from "./services/TokenService";
import { WebsiteService } from "./services/WebsiteService";
import { Socket } from "./socket/Socket";
import { TrackerService } from "./tracker/TrackerService";

export class Server {
  private readonly log = new Logger(__filename);

  public constructor(
    private readonly env: Env.Private,
    private readonly websiteService: WebsiteService,
    private readonly restrictedService: RestrictedService,
    private readonly trackerService: TrackerService,
    private readonly ingestionService: IngestionService,
    private readonly statsService: StatsService,
    private readonly exportService: ExportService,
    private readonly tokenService: TokenService,
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
            clientId: `${randomUUID()}`,
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
          this.ingestionService.registerSocket(socket);
        },
        close: (socket) => {
          this.ingestionService.unregisterSocket(socket);
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
         * External API
         */
        "/api/stats": {
          GET: this.handleRoute(async (request) => {
            const stats = await this.statsService.queryExternal(
              this.searchParams(request),
              request.headers.get("Authorization") || undefined,
            );
            return Response.json(stats);
          }),
        },

        /**
         * Public script
         */
        [ServerEndpoint.Public.script]: {
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
        [ServerEndpoint.Public.ingestion]: {
          POST: this.handleRoute(async (request) => {
            const ip = server.requestIP(request);
            if (ip) {
              await this.ingestionService.ingest(ip.address, await request.json());
            }
            return new Response();
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
            const websites: WebsiteRM[] = await this.websiteService.list();
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
          PATCH: this.handleRoute(async (request) => {
            const website: Website = await this.websiteService.update(request.params.ref, await request.json());
            return Response.json(website);
          }),
          DELETE: this.handleRoute(async ({ params }) => {
            const website: Website = await this.websiteService.delete(params.ref);
            return Response.json(website);
          }),
        },
        "/internal-api/websites/:ref/export": {
          POST: this.handleRoute(async (request) => {
            const { stream } = await this.exportService.export(request.params.ref, await request.json());
            return new Response(stream, {
              headers: {
                "content-type": "application/json",
              },
            });
          }),
        },

        /**
         * Stats
         */
        "/internal-api/stats": {
          GET: this.handleRoute(async (request) => {
            const stats = await this.statsService.queryInternal(this.searchParams(request), "unknown");
            return Response.json(stats);
          }),
        },

        /**
         * Tokens
         */
        "/internal-api/tokens": {
          GET: this.handleRoute(async () => {
            const tokens: TokenRM[] = await this.tokenService.list();
            return Response.json(tokens);
          }),
          POST: this.handleRoute(async (request) => {
            const token: TokenRM = await this.tokenService.generate(await request.json());
            return Response.json(token);
          }),
        },
        "/internal-api/tokens/:id": {
          DELETE: this.handleRoute(async ({ params }) => {
            const token: TokenRM = await this.tokenService.delete(params.id);
            return Response.json(token);
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
          POST: this.handleRoute(async (request) => {
            if (this.env.X_VISAGE_ENABLE_RESTRICTED_ENTPOINTS) {
              await this.restrictedService.seed(await request.json().catch(() => ({})));
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
        `  🚀 \x1b[1mVisage started on ${Prettify.timestamp(Temporal.Now.instant(), this.env.O_VISAGE_TIMEZONE, {
          yearFmt: "present",
          monthFmt: "full",
          secondFmt: "present",
        })} (${this.env.O_VISAGE_TIMEZONE})\x1b[0m`,
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
