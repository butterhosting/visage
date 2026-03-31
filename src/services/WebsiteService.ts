import { ServerError } from "@/errors/ServerError";
import { ZodProblem } from "@/helpers/ZodIssues";
import { Website } from "@/models/Website";
import { WebsiteRepository } from "@/repositories/WebsiteRepository";
import z from "zod/v4";

export class WebsiteService {
  public constructor(private readonly websiteRepository: WebsiteRepository) {}

  public async query(): Promise<Website[]> {
    return await this.websiteRepository.query();
  }

  public async create(unknown: z.output<typeof WebsiteService.Upsert>): Promise<Website> {
    const { hostname } = WebsiteService.Upsert.parse(unknown);
    throw new Error("not implemented");
  }
}

export namespace WebsiteService {
  export const Upsert = z
    .object({
      hostname: z.string(),
    })
    .catch((e) => {
      throw ServerError.invalid_request_body(ZodProblem.issuesSummary(e));
    });
}
