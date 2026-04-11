import { ServerError } from "@/errors/ServerError";
import { WebsiteError } from "@/errors/WebsiteError";
import { ZodProblem } from "@/helpers/ZodIssues";
import { Stats } from "@/models/Stats";
import { Website } from "@/models/Website";
import { WebsiteRM } from "@/models/WebsiteRM";
import { WebsiteRepository } from "@/repositories/WebsiteRepository";
import { Temporal } from "@js-temporal/polyfill";
import z from "zod/v4";
import { StatsService } from "./StatsService";

export class WebsiteService {
  public constructor(
    private readonly websiteRepository: WebsiteRepository,
    private readonly statsService: StatsService,
  ) {}

  public async query(): Promise<WebsiteRM[]> {
    const websites = await this.websiteRepository.query();
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
    const website = await this.websiteRepository.create({
      id: Bun.randomUUIDv7(),
      object: "website",
      created: Temporal.Now.instant(),
      hostname,
      hasData: false,
    });
    return await this.enrich(website);
  }

  public async update(ref: string, unknown: z.output<typeof WebsiteService.Upsert>): Promise<WebsiteRM> {
    const { hostname } = WebsiteService.Upsert.parse(unknown);
    const website = await this.websiteRepository
      .update(ref, {
        hostname,
      })
      .then((w) => {
        if (!w) throw WebsiteError.not_found({ ref });
        return w;
      });
    return await this.enrich(website);
  }

  public async delete(ref: string): Promise<WebsiteRM> {
    // TODO: message event to the TokenService --- might need to update its array of websites
    const website = await this.find(ref);
    await this.websiteRepository.delete(website.id);
    return website;
  }

  private async enrich(website: Website): Promise<WebsiteRM> {
    const today = Temporal.Now.plainDateISO().toZonedDateTime("UTC");
    const { visitorsTimeSeries } = await this.statsService.queryInternal({
      website: website.id,
      fields: [Stats.Field.visitorsTimeSeries],
      from: today.subtract({ days: 30 }).toInstant(),
      to: today.add({ days: 1 }).toInstant(),
    });
    return {
      ...website,
      visitorsTotal30d: visitorsTimeSeries!.data.reduce((sum, datapoint) => sum + datapoint.y, 0),
      visitorsTimeSeries30d: visitorsTimeSeries!,
    };
  }
}

export namespace WebsiteService {
  export const Upsert = z
    .object({
      hostname: z
        .string()
        .transform((s) => s.trim().toLowerCase())
        .refine((s) => s === "localhost" || s.includes(".")),
    })
    .catch((e) => {
      throw ServerError.invalid_request_body(ZodProblem.issuesSummary(e));
    });
}
