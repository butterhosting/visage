import { TokenConverter } from "@/drizzle/converters/TokenConverter";
import { Sqlite } from "@/drizzle/sqlite";
import { $token } from "@/drizzle/tables/$token";
import { Token } from "@/models/Token";
import { Temporal } from "@js-temporal/polyfill";
import { eq, like } from "drizzle-orm";
import { PersistenceError } from "./error/PersistenceError";

export class TokenRepository {
  public constructor(private readonly sqlite: Sqlite) {}

  public async list(): Promise<Token[]> {
    const tokens = await this.sqlite.query.$token.findMany();
    return tokens.map(TokenConverter.convert);
  }

  public async find(id: string): Promise<Token | undefined> {
    const token = await this.sqlite.query.$token.findFirst({
      where: eq($token.id, id),
    });
    return token ? TokenConverter.convert(token) : undefined;
  }

  public async create(token: Token): Promise<Token | undefined> {
    return await this.sqlite
      .insert($token)
      .values(TokenConverter.convert(token))
      .then(
        () => token,
        (err) => {
          throw PersistenceError.cast(err);
        },
      );
  }

  public async updateUsage(id: string): Promise<Token | undefined> {
    const [token] = await this.sqlite
      .update($token)
      .set({
        lastUsed: Temporal.Now.instant().toString(),
      })
      .where(eq($token.id, id))
      .returning();
    return token ? TokenConverter.convert(token) : undefined;
  }

  public async updateAllByRemovingWebsite(websiteId: string): Promise<void> {
    const candidates = await this.sqlite.query.$token.findMany({
      where: like($token.websiteIds, `%${websiteId}%`),
    });
    for (const candidate of candidates) {
      const token = TokenConverter.convert(candidate);
      if (token.websiteIds !== "*" && token.websiteIds.includes(websiteId)) {
        const remainingWebsiteIds = token.websiteIds.filter((wid) => wid !== websiteId);
        if (remainingWebsiteIds.length === 0) {
          await this.sqlite.delete($token).where(eq($token.id, token.id));
        } else {
          await this.sqlite
            .update($token)
            .set({ websiteIds: remainingWebsiteIds.join(",") })
            .where(eq($token.id, token.id));
        }
      }
    }
  }

  public async delete(id: string): Promise<Token | undefined> {
    const [token] = await this.sqlite.delete($token).where(eq($token.id, id)).returning();
    return token ? TokenConverter.convert(token) : undefined;
  }
}
