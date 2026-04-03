import { Stats } from "@/models/Stats";
import { StatsQuery } from "@/models/StatsQuery";
import { Yesttp } from "yesttp";

export class StatsClient {
  public constructor(private readonly yesttp: Yesttp) {}

  public async query({ fields, from, to, ...q }: StatsQuery): Promise<Stats> {
    const { body } = await this.yesttp.get<unknown>("/stats", {
      searchParams: {
        fields: fields.join(","),
        from: from?.toString(),
        to: to?.toString(),
        ...q,
      },
    });
    return Stats.parse(body);
  }
}
