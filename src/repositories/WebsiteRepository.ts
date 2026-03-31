import { $website } from "@/drizzle/schema";
import { Sqlite } from "@/drizzle/sqlite";
import { WebsiteError } from "@/errors/WebsiteError";
import { Website } from "@/models/Website";
import { eq } from "drizzle-orm";
import { WebsiteConverter } from "./converters/WebsiteConverter";

export class WebsiteRepository {
  public constructor(private readonly sqlite: Sqlite) {}

  public async query(): Promise<Website[]> {
    const websites = await this.sqlite.query.$website.findMany();
    return websites.map(WebsiteConverter.convert);
  }

  public async findByHostname(hostname: string): Promise<Website> {
    const website = await this.sqlite.query.$website.findFirst({
      where: eq($website.hostname, hostname),
    });
    if (!website) {
      throw WebsiteError.not_found({ hostname });
    }
    return WebsiteConverter.convert(website);
  }
}
