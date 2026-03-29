import { Env } from "@/Env";
import { readFile } from "fs/promises";

export class TrackerScriptService {
  private cachedScript?: string;

  public constructor(private readonly env: Env.Private) {}

  public async getMinifiedScript(): Promise<string> {
    if (!this.cachedScript || this.env.O_VISAGE_STAGE !== "production") {
      this.cachedScript = await readFile(this.env.X_VISAGE_TRACKER_SCRIPT, "utf-8");
    }
    return this.cachedScript;
  }
}
