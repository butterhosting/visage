import { TokenRM } from "@/models/TokenRM";
import { Yesttp } from "yesttp";

export class TokenClient {
  public constructor(private readonly yesttp: Yesttp) {}

  public async list(): Promise<TokenRM[]> {
    const { json } = await this.yesttp.get<unknown[]>("/tokens");
    return json.map(TokenRM.parse);
  }

  public async generate(websites: string[] | "*"): Promise<TokenRM> {
    const { json } = await this.yesttp.post<unknown>("/tokens", { body: { websites } });
    return TokenRM.parse(json);
  }

  public async delete(id: string): Promise<TokenRM> {
    const { json } = await this.yesttp.delete(`/tokens/${id}`);
    return TokenRM.parse(json);
  }
}
