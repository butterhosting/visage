import { Artifact } from "@/models/Artifact";
import { Website } from "@/models/Website";
import { WebsiteRM } from "@/models/WebsiteRM";
import { Yesttp } from "yesttp";

export class WebsiteClient {
  public constructor(private readonly yesttp: Yesttp) {}

  public async query(): Promise<WebsiteRM[]> {
    const { json } = await this.yesttp.get<unknown[]>("/websites");
    return json.map(WebsiteRM.parse);
  }

  public async find(ref: string): Promise<WebsiteRM> {
    const { json } = await this.yesttp.get<unknown>(`/websites/${ref}`);
    return WebsiteRM.parse(json);
  }

  public async create(hostname: string): Promise<WebsiteRM> {
    const { json } = await this.yesttp.post<unknown>("/websites", { body: { hostname } });
    return WebsiteRM.parse(json);
  }

  public async update(ref: string, data: Pick<Website, "hostname">): Promise<WebsiteRM> {
    const { json } = await this.yesttp.patch<unknown>(`/websites/${ref}`, { body: data });
    return WebsiteRM.parse(json);
  }

  public async delete(ref: string): Promise<WebsiteRM> {
    const { json } = await this.yesttp.delete(`/websites/${ref}`);
    return WebsiteRM.parse(json);
  }

  public async export(ref: string, artifact: Artifact.Enum): Promise<Blob> {
    const { blob } = await this.yesttp.post(`/websites/${ref}/export`, {
      body: { artifact },
      responseType: "blob",
    });
    return blob;
  }
}
