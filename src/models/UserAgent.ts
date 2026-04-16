import Bowser from "bowser";

export class UserAgent {
  private readonly result: Bowser.Parser.ParsedResult;

  public constructor(private readonly ua: string) {
    this.result = Bowser.parse(ua);
  }

  public original(): string {
    return this.ua;
  }

  public browser(): string | undefined {
    return this.result.browser.name;
  }

  public os(): string | undefined {
    return this.result.os.name;
  }

  public isBotPlatform(): boolean {
    return this.result.platform.type?.toLowerCase() === "bot";
  }
}
