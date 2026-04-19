import { Env } from "@/Env";
import { ServerError } from "@/errors/ServerError";
import { WebsiteError } from "@/errors/WebsiteError";
import { Event } from "@/events/Event";
import { EventBus } from "@/events/EventBus";
import { ZodProblem } from "@/helpers/ZodIssues";
import { Period } from "@/models/Period";
import { Stats } from "@/models/Stats";
import { Website } from "@/models/Website";
import { WebsiteRM } from "@/models/WebsiteRM";
import { PersistenceError } from "@/repositories/error/PersistenceError";
import { WebsiteRepository } from "@/repositories/WebsiteRepository";
import { Temporal } from "@js-temporal/polyfill";
import z from "zod/v4";
import { StatsService } from "./StatsService";

export class WebsiteService {
  public constructor(
    private readonly env: Env.Private,
    private readonly websiteRepository: WebsiteRepository,
    private readonly statsService: StatsService,
    private readonly eventBus: EventBus,
  ) {}

  public async list(): Promise<WebsiteRM[]> {
    const websites = await this.websiteRepository.list();
    const enrichedWebsites = await Promise.all(websites.map((w) => this.enrich(w)));
    return enrichedWebsites.sort((w1, w2) => -Math.sign(w1.visitorsTotal30d - w2.visitorsTotal30d));
  }

  public async find(ref: string): Promise<WebsiteRM> {
    const website = await this.websiteRepository.find(ref, () =>
      WebsiteError.not_found({
        ref,
      }),
    );
    return await this.enrich(website);
  }

  public async create(unknown: z.output<typeof WebsiteService.Upsert>): Promise<WebsiteRM> {
    const { hostname } = WebsiteService.Upsert.parse(unknown);
    const website = await this.websiteRepository
      .create({
        id: Bun.randomUUIDv7(),
        object: "website",
        created: Temporal.Now.instant(),
        hostname,
        hasData: false,
      })
      .catch((err) => {
        if (PersistenceError.isUniqueViolation(err)) {
          throw WebsiteError.already_exists({ hostname });
        }
        throw err;
      });
    this.eventBus.publish(Event.Type.website_created, { website });
    return await this.enrich(website);
  }

  public async update(ref: string, unknown: z.output<typeof WebsiteService.Upsert>): Promise<WebsiteRM> {
    const { hostname } = WebsiteService.Upsert.parse(unknown);
    const website = await this.websiteRepository
      .update(ref, {
        hostname,
      })
      .then(
        (w) => {
          if (!w) throw WebsiteError.not_found({ ref });
          return w;
        },
        (err) => {
          if (PersistenceError.isUniqueViolation(err)) {
            throw WebsiteError.already_exists({ hostname });
          }
          throw err;
        },
      );
    this.eventBus.publish(Event.Type.website_updated, { website });
    return await this.enrich(website);
  }

  public async delete(ref: string): Promise<WebsiteRM> {
    const website = await this.websiteRepository.find(ref, () =>
      WebsiteError.not_found({
        ref,
      }),
    );
    const websiteEnriched = await this.enrich(website);
    await this.websiteRepository.delete(website.id);
    this.eventBus.publish(Event.Type.website_deleted, { website });
    return websiteEnriched;
  }

  private async enrich(website: Website): Promise<WebsiteRM> {
    const { from, to } = Period.forPreset(Period.Preset.last30d, this.env.O_VISAGE_TIMEZONE);
    const { visitorsTimeSeries } = await this.statsService.queryInternal({
      website: website.id,
      fields: [Stats.Field.visitorsTimeSeries],
      from,
      to,
    });
    return {
      ...website,
      visitorsTotal30d: visitorsTimeSeries!.data.reduce((sum, datapoint) => sum + datapoint.y, 0),
      visitorsTimeSeries30d: visitorsTimeSeries!,
    };
  }
}

export namespace WebsiteService {
  const hostnameRegex = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

  export const Upsert = z
    .object({
      hostname: z
        .string()
        .transform((s) => s.trim().toLowerCase())
        .refine((s) => s === "localhost" || hostnameRegex.test(s)),
    })
    .catch((e) => {
      throw ServerError.invalid_request_body(ZodProblem.issuesSummary(e));
    });
}
