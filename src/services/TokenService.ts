import { ServerError } from "@/errors/ServerError";
import { TokenError } from "@/errors/TokenError";
import { ZodProblem } from "@/helpers/ZodIssues";
import { Token } from "@/models/Token";
import { TokenRM } from "@/models/TokenRM";
import { TokenRepository } from "@/repositories/TokenRepository";
import { Temporal } from "@js-temporal/polyfill";
import { createHash } from "crypto";
import z from "zod/v4";

export class TokenService {
  public constructor(private readonly tokenRepository: TokenRepository) {}

  public async list(): Promise<TokenRM[]> {
    const tokens = await this.tokenRepository.list();
    return tokens.map((t) => this.convert(t));
  }

  public async generate(unknown: z.output<typeof TokenService.Generate>): Promise<TokenRM> {
    const { websites } = TokenService.Generate.parse(unknown);

    const secretPlain = Token.generateSecret();
    const secretHash = createHash("sha256").update(secretPlain, "utf8").digest("hex");

    let token: Token | undefined;
    while (true) {
      token = await this.tokenRepository.create({
        id: Token.generateId(),
        object: "token_internal",
        created: Temporal.Now.instant(),
        websiteIds: websites,
        secretHash,
        secretPlain,
      });
      if (token) {
        break;
      }
    }

    return this.convert(token);
  }

  public async validate(serializedToken: string): Promise<TokenRM | undefined> {
    const { id, secret } = Token.split(serializedToken);
    const token = await this.tokenRepository.find(id);
    if (token && secret) {
      const incomingHash = createHash("sha256").update(secret, "utf8").digest("hex");
      if (incomingHash === token.secretHash) {
        await this.tokenRepository.recordUsage(id);
        return this.convert(token);
      }
    }
    return undefined;
  }

  public async delete(id: string): Promise<TokenRM> {
    const token = await this.tokenRepository.delete(id);
    if (!token) {
      throw TokenError.not_found({ id });
    }
    return this.convert(token);
  }

  private convert(token: Token): TokenRM {
    return {
      id: token.id,
      object: "token",
      created: token.created,
      websiteIds: token.websiteIds,
      lastUsed: token.lastUsed,
      value: token.secretPlain ? Token.combine(token.id, token.secretPlain) : undefined,
    };
  }
}

export namespace TokenService {
  export const Generate = z
    .object({
      websites: z.union([z.literal("*"), z.array(z.string())]),
    })
    .catch((e) => {
      throw ServerError.invalid_request_body(ZodProblem.issuesSummary(e));
    });
  export const Validate = z
    .object({
      websites: z.union([z.literal("*"), z.array(z.string())]),
    })
    .catch((e) => {
      throw ServerError.invalid_request_body(ZodProblem.issuesSummary(e));
    });
}
