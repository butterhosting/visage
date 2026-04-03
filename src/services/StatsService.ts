import { Sqlite } from "@/drizzle/sqlite";
import { WebsiteError } from "@/errors/WebsiteError";
import { Stats } from "@/models/Stats";
import { StatsQuery } from "@/models/StatsQuery";
import { WebsiteRepository } from "@/repositories/WebsiteRepository";

export class StatsService {
  public constructor(
    private readonly sqlite: Sqlite,
    private readonly websiteRepository: WebsiteRepository,
  ) {}

  public async query(unknown: unknown): Promise<Stats> {
    const q = StatsQuery.parse(unknown);
    const website = await this.websiteRepository.find(q.website, () =>
      WebsiteError.not_found({
        ref: q.website,
      }),
    );

    throw new Error("not implemented");
  }
}
