import { Yesttp } from "yesttp";

export class PipelineClient {
  public constructor(private readonly yesttp: Yesttp) {}

  public async query(): Promise<[]> {
    return [];
  }
}
