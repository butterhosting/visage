import { BrowserPayload } from "@/models/BrowserPayload";
import { Yesttp } from "yesttp";

export class RestrictedClient {
  public constructor(private readonly yesttp: Yesttp) {}

  public async purge(): Promise<void> {
    await this.yesttp.post("/restricted/purge");
  }

  public async seed(): Promise<void> {
    // await this.yesttp.post("/restricted/seed");
    await new Yesttp().post("/i", {
      body: this.createFrontendPayload(),
    });
  }

  private createFrontendPayload(): BrowserPayload {
    return {
      url: window.location.href,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      locale: navigator.language || undefined,
      spaCount: 0, // For SPA's
    };
  }
}
