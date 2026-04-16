import { Env } from "@/Env";
import { UserAgent } from "@/models/UserAgent";
import { beforeEach, describe, expect, it } from "bun:test";
import { BotDetectionService } from "./BotDetectionService";

describe(BotDetectionService.name, () => {
  let service: BotDetectionService;

  beforeEach(() => {
    service = new BotDetectionService({ O_VISAGE_STAGE: "production" } as Env.Private);
  });

  it.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
    "Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
  ])("detects bots (crawlers): %s", async (ua) => {
    // when
    const isBot = await service.isBot({ userAgent: new UserAgent(ua), clientSignal: false });
    // then
    expect(isBot).toBeTrue();
  });

  it.each([
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessFirefox/125.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Playwright",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Puppeteer",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) cypress/12.0.0 Chrome/125.0.0.0 Electron/28.0.0 Safari/537.36",
  ])("detects bots (headless/automation): %s", async (ua) => {
    // when
    const isBot = await service.isBot({ userAgent: new UserAgent(ua), clientSignal: false });
    // then
    expect(isBot).toBeTrue();
  });

  it.each([
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.2535.67",
  ])("detects allegedly real people: %s", async (ua) => {
    // when
    const isBot = await service.isBot({ userAgent: new UserAgent(ua), clientSignal: false });
    // then
    expect(isBot).toBeFalse();
  });
});
