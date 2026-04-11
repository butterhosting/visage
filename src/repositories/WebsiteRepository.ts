import { $website } from "@/drizzle/schema";
import { Sqlite } from "@/drizzle/sqlite";
import { Website } from "@/models/Website";
import { eq, or } from "drizzle-orm";
import { WebsiteConverter } from "../drizzle/converters/WebsiteConverter";

export class WebsiteRepository {
  public constructor(private readonly sqlite: Sqlite) {}

  public async query(): Promise<Website[]> {
    const websites = await this.sqlite.query.$website.findMany();
    return websites.map<Website>(WebsiteConverter.convert);
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

  // TODO: return `undefined` if `id`/`hostname` already exists
  public async create(website: Website): Promise<Website> {
    await this.sqlite.insert($website).values(WebsiteConverter.convert(website));
    return website;
  }

  public async update(ref: string, update: Partial<Website>): Promise<Website | undefined> {
    const [website] = await this.sqlite
      .update($website)
      .set(WebsiteConverter.convert(update))
      .where(or(eq($website.id, ref), eq($website.hostname, ref)))
      .returning();
    return website ? WebsiteConverter.convert(website) : undefined;
  }

  public async delete(ref: string): Promise<Website | undefined> {
    const [website] = await this.sqlite
      .delete($website)
      .where(or(eq($website.id, ref), eq($website.hostname, ref)))
      .returning();
    return website ? WebsiteConverter.convert(website) : undefined;
  }
}
