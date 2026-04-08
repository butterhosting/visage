import { $analyticsEvent, $botEvent } from "@/drizzle/schema";
import { Sqlite } from "@/drizzle/sqlite";
import { ServerError } from "@/errors/ServerError";
import { WebsiteError } from "@/errors/WebsiteError";
import { ZodProblem } from "@/helpers/ZodIssues";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { Artifact } from "@/models/Artifact";
import { AnalyticsEventConverter } from "@/repositories/converters/AnalyticsEventConverter";
import { WebsiteRepository } from "@/repositories/WebsiteRepository";
import { and, eq, gt, SQL } from "drizzle-orm";
import { z } from "zod/v4";

export class ExportService {
  private readonly RECORD_BUFFER_SIZE = 5000;

  public constructor(
    private readonly sqlite: Sqlite,
    private readonly websiteRepository: WebsiteRepository,
  ) {}

  public async export(websiteRef: string, unknown: unknown): Promise<{ stream: ReadableStream<Uint8Array>; filename: string }> {
    const { artifact } = ExportService.Export.parse(unknown);
    const website = await this.websiteRepository.find(websiteRef, () => WebsiteError.not_found({ ref: websiteRef }));
    return {
      stream: this.streamJsonArray(website.id, artifact),
      filename: `${website.hostname}.${artifact}.json`,
    };
  }

  private streamJsonArray(websiteId: string, artifact: Artifact.Enum): ReadableStream<Uint8Array> {
    const sqlite = this.sqlite;
    const encoder = new TextEncoder();

    return new ReadableStream({
      start: async (controller) => {
        controller.enqueue(encoder.encode('{"data":['));
        let cursor: string | undefined;
        let first = true;
        while (true) {
          const rows = await this.queryBatch(sqlite, websiteId, artifact, cursor);
          if (rows.length === 0) break;
          for (const { event } of rows) {
            const prefix = first ? "" : ",";
            first = false;
            controller.enqueue(encoder.encode(prefix + JSON.stringify(event)));
          }
          cursor = rows[rows.length - 1].id;
          if (rows.length < this.RECORD_BUFFER_SIZE) break;
        }
        controller.enqueue(encoder.encode("]}"));
        controller.close();
      },
    });
  }

  private async queryBatch(
    sqlite: Sqlite,
    websiteId: string,
    artifact: Artifact.Enum,
    cursor?: string,
  ): Promise<Array<{ id: string; event: AnalyticsEvent }>> {
    switch (artifact) {
      case Artifact.Enum.analytics: {
        const where: SQL[] = [eq($analyticsEvent.websiteId, websiteId)];
        if (cursor) {
          where.push(gt($analyticsEvent.id, cursor));
        }
        const records = await sqlite
          .select()
          .from($analyticsEvent)
          .where(and(...where))
          .orderBy($analyticsEvent.id)
          .limit(this.RECORD_BUFFER_SIZE);
        return records.map((record) => AnalyticsEventConverter.convert(record)).map((event) => ({ id: event.id, event }));
      }
      case Artifact.Enum.bots: {
        const where: SQL[] = [eq($botEvent.websiteId, websiteId)];
        if (cursor) {
          where.push(gt($botEvent.id, cursor));
        }
        const records = await sqlite
          .select()
          .from($botEvent)
          .where(and(...where))
          .orderBy($botEvent.id)
          .limit(this.RECORD_BUFFER_SIZE);
        return records.map((record) => ({ id: record.id, event: JSON.parse(record.json) }));
      }
    }
  }
}

export namespace ExportService {
  export const Export = z
    .object({
      artifact: z.enum(Artifact.Enum),
    })
    .catch((e) => {
      throw ServerError.invalid_request_body(ZodProblem.issuesSummary(e));
    });
}
