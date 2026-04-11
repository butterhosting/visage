import { TokenConverter } from "@/drizzle/converters/TokenConverter";
import { Sqlite } from "@/drizzle/sqlite";
import { $token } from "@/drizzle/tables/$token";
import { Token } from "@/models/Token";
import { eq } from "drizzle-orm";

export class TokenRepository {
  public constructor(private readonly sqlite: Sqlite) {}

  public async list(): Promise<Token[]> {
    const tokens = await this.sqlite.query.$token.findMany();
    return tokens.map(TokenConverter.convert);
  }

  public async create(token: Token): Promise<Token | undefined> {
    // TODO: return undefined if we get an primary key unique violation
    await this.sqlite.insert($token).values(TokenConverter.convert(token));
    return token;
  }

  public async find(id: string): Promise<Token | undefined> {
    const token = await this.sqlite.query.$token.findFirst({
      where: eq($token.id, id),
    });
    return token ? TokenConverter.convert(token) : undefined;
  }

  public async delete(id: string): Promise<Token | undefined> {
    const [token] = await this.sqlite.delete($token).where(eq($token.id, id)).returning();
    return token ? TokenConverter.convert(token) : undefined;
  }
}
