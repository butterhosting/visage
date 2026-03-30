import { Website } from "@/models/Website";
import { WebsiteRepository } from "@/repositories/WebsiteRepository";

export class WebsiteService {
  public constructor(private readonly websiteRepository: WebsiteRepository) {}

  public async query(): Promise<Website[]> {
    return await this.websiteRepository.query();
  }
}
