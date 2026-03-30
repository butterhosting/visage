import Bowser from "bowser";

export class BotDetectionService {
  private readonly HEADLESS_PATTERN =
    /HeadlessChrome|HeadlessFirefox|PhantomJS|Playwright|Puppeteer|Selenium|WebDriver|CasperJS|SlimerJS|Nightmare|cypress/i;

  public async isBot({ userAgent }: { userAgent: string }): Promise<boolean> {
    if (this.HEADLESS_PATTERN.test(userAgent)) {
      return true;
    }
    const browser = Bowser.getParser(userAgent);
    return browser.getPlatformType(true) === "bot";
  }
}
