import { Website } from "@/models/Website";
import { Yesttp } from "yesttp";

export class WebsiteClient {
  public constructor(private readonly yesttp: Yesttp) {}

  public async query(): Promise<Website[]> {
    const { body } = await this.yesttp.get<Website[]>("/websites");
    return body;
  }
}
