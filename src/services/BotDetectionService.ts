import { Env } from "@/Env";
import { Logger } from "@/Logger";
import { UserAgent } from "@/models/UserAgent";
import Bowser from "bowser";

type Input = {
  userAgent: UserAgent;
  clientSignal: boolean;
};
export class BotDetectionService {
  private readonly log = new Logger(__filename);
  private readonly headless =
    /HeadlessChrome|HeadlessFirefox|PhantomJS|Playwright|Puppeteer|Selenium|WebDriver|CasperJS|SlimerJS|Nightmare|cypress/i;
  private readonly performBotDetection: boolean;

  public constructor(env: Env.Private) {
    this.performBotDetection = env.O_VISAGE_STAGE === "production";
  }

  public async isBot({ userAgent, clientSignal }: Input): Promise<boolean> {
    const headlessMatch = this.headless.test(userAgent.original());
    const platformTest = userAgent.isBotPlatform();
    this.log.debug(`Bot detection; clientSignal=${clientSignal}, headlessMatch=${headlessMatch}, platformTest=${platformTest}`);
    if (this.performBotDetection) {
      if (clientSignal || headlessMatch || platformTest) {
        return true;
      }
    }
    return false;
  }
}
