import { WebsiteRM } from "@/models/WebsiteRM";
import { Yesttp } from "yesttp";

export class WebsiteClient {
  public constructor(private readonly yesttp: Yesttp) {}

  public async query(): Promise<WebsiteRM[]> {
    const { body } = await this.yesttp.get<unknown[]>("/websites");
    return body.map(WebsiteRM.parse);
  }

  public async find(ref: string): Promise<WebsiteRM> {
    const { body } = await this.yesttp.get<unknown>(`/websites/${ref}`);
    return WebsiteRM.parse(body);
  }
}
