import { Artifact } from "@/models/Artifact";
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

  public async create(hostname: string): Promise<WebsiteRM> {
    const { body } = await this.yesttp.post<unknown>("/websites", { body: { hostname } });
    return WebsiteRM.parse(body);
  }

  public async delete(ref: string): Promise<void> {
    await this.yesttp.delete(`/websites/${ref}`);
  }

  public async download(hostname: string, artifact: Artifact.Enum): Promise<void> {
    const response = await fetch(`/internal-api/websites/${hostname}/download`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ artifact }),
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = Artifact.filename(artifact, hostname);
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
