import { $website } from "@/drizzle/schema";
import { Sqlite } from "@/drizzle/sqlite";
import { Website } from "@/models/Website";
import { eq, or } from "drizzle-orm";
import { WebsiteConverter } from "./converters/WebsiteConverter";

export class WebsiteRepository {
  public constructor(private readonly sqlite: Sqlite) {}

  public async query(): Promise<Website[]> {
    const websites = await this.sqlite.query.$website.findMany();
    return websites.map(WebsiteConverter.convert);
  }

  public async find(ref: string): Promise<Website | undefined>;
  public async find(ref: string, errorFn: () => Error): Promise<Website>;
  public async find(ref: string, errorFn?: () => Error): Promise<Website | undefined> {
    const website = await this.sqlite.query.$website.findFirst({
      where: or(eq($website.id, ref), eq($website.hostname, ref)),
    });
    if (website) {
      return WebsiteConverter.convert(website);
    }
    if (errorFn) {
      throw errorFn();
    }
    return undefined;
  }
}
