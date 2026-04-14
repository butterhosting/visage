import { ServerError } from "@/errors/ServerError";
import { TokenError } from "@/errors/TokenError";
import { Event } from "@/events/Event";
import { EventBus } from "@/events/EventBus";
import { ZodProblem } from "@/helpers/ZodIssues";
import { Token } from "@/models/Token";
import { TokenRM } from "@/models/TokenRM";
import { PersistenceError } from "@/repositories/error/PersistenceError";
import { TokenRepository } from "@/repositories/TokenRepository";
import { WebsiteRepository } from "@/repositories/WebsiteRepository";
import { Temporal } from "@js-temporal/polyfill";
import { createHash } from "crypto";
import z from "zod/v4";

export class TokenService {
  public constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly websiteRepository: WebsiteRepository,
    eventBus: EventBus,
  ) {
    eventBus.subscribe(Event.Type.website_deleted, ({ data: { website } }) => tokenRepository.updateAllByRemovingWebsite(website.id));
  }

  public async list(): Promise<TokenRM[]> {
    const tokens = await this.tokenRepository.list();
    return tokens.map((t) => this.convert(t));
  }

  public async generate(unknown: z.output<typeof TokenService.Generate>): Promise<TokenRM> {
    const { websites } = TokenService.Generate.parse(unknown);

    if (websites !== "*") {
      const { nonExistingIds } = await this.websiteRepository.exist(websites);
      if (nonExistingIds.length > 0) {
        throw TokenError.websites_not_found({ ids: nonExistingIds });
      }
    }

    const secretPlain = Token.generateSecret();
    const secretHash = createHash("sha256").update(secretPlain, "utf8").digest("hex");

    let token: Token | undefined;
    let attempt = 1;
    while (true) {
      token = await this.tokenRepository
        .create({
          id: Token.generateId(),
          object: "token_internal",
          created: Temporal.Now.instant(),
          websiteIds: websites,
          secretHash,
          secretPlain,
        })
        .catch((err) => {
          if (PersistenceError.isPrimaryKeyViolation(err)) {
            return undefined;
          }
          throw err;
        });
      if (token) {
        break;
      }
      if (attempt > 100) {
        throw new Error(`Illegal state: failed to generate a unique token id after ${attempt} attempts`);
      }
    }

    return this.convert(token);
  }

  public async validate(tokenValue: string): Promise<TokenRM | undefined> {
    const { id, secret } = Token.split(tokenValue);
    const token = await this.tokenRepository.find(id);
    if (token && secret) {
      const incomingHash = createHash("sha256").update(secret, "utf8").digest("hex");
      if (incomingHash === token.secretHash) {
        await this.tokenRepository.updateUsage(id);
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
