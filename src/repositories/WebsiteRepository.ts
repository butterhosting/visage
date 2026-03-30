import { Sqlite } from "@/drizzle/sqlite";
import { Website } from "@/models/Website";
import { WebsiteConverter } from "./converters/WebsiteConverter";
import { eq } from "drizzle-orm";
import { $website } from "@/drizzle/schema";

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
    if (website) {
      return WebsiteConverter.convert(website);
    }
    throw new Error("website not found ..."); // TODO replace every `throw new Error` by our enum type
  }
}
