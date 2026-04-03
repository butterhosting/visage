import { ServerError } from "@/errors/ServerError";
import { ZodProblem } from "@/helpers/ZodIssues";
import { Stats } from "@/models/Stats";
import { TimeSeries } from "@/models/TimeSeries";
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
    const results = await Promise.all(
      websites.map(async (website): Promise<WebsiteRM> => {
        const stats = await this.statsService.query({
          website: website.id,
          fields: [Stats.Field.visitorsTimeSeries],
          from: Temporal.Now.instant().subtract({ hours: 30 * 24 }),
        });
        return {
          ...website,
          visitorsTimeSeries30d: stats.visitorsTimeSeries ?? { tUnit: "day", yUnit: "visitor", data: [] },
        };
      }),
    );
    return results;
  }

  public async create(unknown: z.output<typeof WebsiteService.Upsert>): Promise<Website> {
    const { hostname } = WebsiteService.Upsert.parse(unknown);
    throw new Error("not implemented");
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
