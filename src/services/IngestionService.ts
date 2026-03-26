import { AnalyticsEventRepository } from "@/repositories/AnalyticsEventRepository";

export class IngestionService {
  public constructor(private readonly analyticsEventRepository: AnalyticsEventRepository) {}
}
