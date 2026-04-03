import { Stats } from "@/models/Stats";
import { StatsQuery } from "@/models/StatsQuery";
import { Yesttp } from "yesttp";

export class StatsClient {
  public constructor(private readonly yesttp: Yesttp) {}

  public async query(q: StatsQuery): Promise<Stats> {
    const searchParams: Record<string, string> = {
      website: q.website,
      fields: q.fields.join(","),
    };
    if (q.from) searchParams.from = q.from.toString();
    if (q.to) searchParams.to = q.to.toString();
    if (q.path) searchParams.path = q.path;
    if (q.source) searchParams.source = q.source;
    if (q.screen) searchParams.screen = q.screen;
    if (q.browser) searchParams.browser = q.browser;
    if (q.os) searchParams.os = q.os;
    if (q.country) searchParams.country = q.country;
    if (q.city) searchParams.city = q.city;
    const { body } = await this.yesttp.get<Stats>("/stats", { searchParams });
    return body;
  }
}
