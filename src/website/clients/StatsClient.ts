import { NullSentinel } from "@/helpers/NullSentinel";
import { Stats } from "@/models/Stats";
import { StatsQuery } from "@/models/StatsQuery";
import { Yesttp } from "yesttp";

export class StatsClient {
  public constructor(private readonly yesttp: Yesttp) {}

  public async query({ fields, from, to, ...q }: StatsQuery): Promise<Stats> {
    const searchParams: Record<string, string | undefined> = {
      fields: fields?.join(","),
      from: from?.toString(),
      to: to?.toString(),
    };
    for (const [key, value] of Object.entries(q)) {
      if (value === null) {
        searchParams[key] = NullSentinel.encode(value);
      } else if (value !== undefined) {
        searchParams[key] = String(value);
      }
    }
    const { json } = await this.yesttp.get<unknown>("/stats", { searchParams });
    return Stats.parse(json);
  }
}
