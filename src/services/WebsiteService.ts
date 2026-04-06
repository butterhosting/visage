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
    return await Promise.all(websites.map((w) => this.enrich(w)));
  }

  public async find(ref: string): Promise<WebsiteRM> {
    const website = await this.websiteRepository.find(ref, () =>
      WebsiteError.not_found({
        ref,
      }),
    );
    return await this.enrich(website);
  }

  public async create(unknown: z.output<typeof WebsiteService.Upsert>): Promise<Website> {
    const { hostname } = WebsiteService.Upsert.parse(unknown);
    throw new Error("not implemented");
  }

  private async enrich(website: Website): Promise<WebsiteRM> {
    const today = Temporal.Now.plainDateISO().toZonedDateTime("UTC");
    const { visitorsTimeSeries } = await this.statsService.query({
      website: website.id,
      fields: [Stats.Field.visitorsTimeSeries],
      from: today.subtract({ days: 30 }).toInstant(),
      to: today.add({ days: 1 }).toInstant(),
    });
    return {
      ...website,
      visitorsTotal: visitorsTimeSeries!.data.reduce((sum, datapoint) => sum + datapoint.y, 0),
      visitorsTimeSeries30d: visitorsTimeSeries!,
    };
  }
}

export namespace WebsiteService {
  export const Upsert = z
    .object({
      hostname: z.string(),
    })
    .catch((e) => {
      throw ServerError.invalid_request_body(ZodProblem.issuesSummary(e));
    });
}
