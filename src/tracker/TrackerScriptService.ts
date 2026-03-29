import { Env } from "@/Env";
import { readFile } from "fs/promises";

export class TrackerScriptService {
  private cachedScript?: string;

  public constructor(private readonly env: Env.Private) {}

  public async getMinifiedScript(): Promise<string> {
    if (!this.cachedScript || this.env.O_VISAGE_STAGE !== "production") {
      this.cachedScript = this.replaceVariables(await readFile(this.env.X_VISAGE_TRACKER_SCRIPT, "utf-8"), {
        INGESTION_ENDPOINT: `${this.env.X_VISAGE_HOSTNAME}/i`,
        SKIP_LOCALHOST_COLLECTION: (this.env.O_VISAGE_STAGE !== "production" ? "true" : "false") satisfies "true" | "false",
      });
    }
    return this.cachedScript;
  }

  private replaceVariables(script: string, replacements: Record<string, string>) {
    const result = script.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (!(key in replacements)) {
        throw new Error(`Unresolved template variable: {{${key}}}`);
      }
      return replacements[key];
    });
    for (const key of Object.keys(replacements)) {
      if (!script.includes(`{{${key}}}`)) {
        throw new Error(`Expected template variable {{${key}}} not found in script`);
      }
    }
    return result;
  }
}
