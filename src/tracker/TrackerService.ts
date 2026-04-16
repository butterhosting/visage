import { Env } from "@/Env";
import { readFile } from "fs/promises";
import { join } from "path";

export class TrackerService {
  private cachedScript?: string;

  public constructor(private readonly env: Env.Private) {}

  public async getMinifiedScript(): Promise<string> {
    if (!this.cachedScript || this.env.O_VISAGE_STAGE !== "production") {
      this.cachedScript = this.replaceVariables(await readFile(join(import.meta.dir, "vis.js"), "utf-8"), {
        SKIP_LOCALHOST_COLLECTION: (this.env.O_VISAGE_STAGE === "production" ? "T" : "F") satisfies "T" | "F",
      });
    }
    return this.cachedScript;
  }

  private replaceVariables(script: string, replacements: Record<string, string>): string {
    const result = script.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
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
