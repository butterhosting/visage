import { $website } from "@/drizzle/schema";
import { Sqlite } from "@/drizzle/sqlite";
import { Website } from "@/models/Website";
import { eq, or } from "drizzle-orm";
import { WebsiteConverter } from "../drizzle/converters/WebsiteConverter";
import { PersistenceError } from "./error/PersistenceError";

export class WebsiteRepository {
  public constructor(private readonly sqlite: Sqlite) {}

  public async list(): Promise<Website[]> {
    const websites = await this.sqlite.query.$website.findMany({
      orderBy: $website.id,
    });
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

  public async create(website: Website): Promise<Website> {
    return await this.sqlite
      .insert($website)
      .values(WebsiteConverter.convert(website))
      .then(
        () => website,
        (err) => {
          throw PersistenceError.tryCast(err);
        },
      );
  }

  public async update(ref: string, update: Partial<Website>): Promise<Website | undefined> {
    const [website] = await this.sqlite
      .update($website)
      .set(WebsiteConverter.convert(update))
      .where(or(eq($website.id, ref), eq($website.hostname, ref)))
      .returning()
      .catch((err) => {
        throw PersistenceError.tryCast(err);
      });
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
