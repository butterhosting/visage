import { Stats } from "@/models/Stats";
import { StatsQuery } from "@/models/StatsQuery";
import { Yesttp } from "yesttp";

export class StatsClient {
  public constructor(private readonly yesttp: Yesttp) {}

  public async query({ fields, from, to, source, browser, os, country, city, ...q }: StatsQuery): Promise<Stats> {
    const { body } = await this.yesttp.get<unknown>("/stats", {
      searchParams: {
        fields: fields.join(","),
        from: from?.toString(),
        to: to?.toString(),
        // TODO: centralize this @null stuff ...
        source: source === null ? "@null" : source,
        browser: browser === null ? "@null" : browser,
        os: os === null ? "@null" : os,
        country: country === null ? "@null" : country,
        city: city === null ? "@null" : city,
        ...q,
      },
    });
    return Stats.parse(body);
  }
}
