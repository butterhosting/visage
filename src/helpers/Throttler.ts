import { Temporal } from "@js-temporal/polyfill";

type Opts = {
  cooldown: Temporal.Duration;
  setTimeoutFn?: typeof setTimeout;
};
export class Throttler {
  private readonly history: Map<string, { t: Temporal.Instant; timeoutId?: NodeJS.Timeout }> = new Map();
  private readonly cooldown: Temporal.Duration;
  private readonly setTimeoutFn: typeof setTimeout;

  public constructor({ cooldown, setTimeoutFn = setTimeout.bind(global) }: Opts) {
    if (cooldown.sign <= 0) {
      throw new Error(`Invalid non-positive cooldown: ${cooldown.toString()}`);
    }
    this.cooldown = cooldown;
    this.setTimeoutFn = setTimeoutFn;
  }

  public submit(id: string, callback: () => unknown) {
    const now = Temporal.Now.instant();
    const previous = this.history.get(id);
    if (previous) {
      const existingTimeout = Boolean(previous.timeoutId);
      if (!existingTimeout) {
        const elapsed = now.since(previous.t);
        const remainingWaitTime = this.cooldown.subtract(elapsed);
        if (remainingWaitTime.sign > 0) {
          previous.timeoutId = this.setTimeoutFn(() => {
            previous.t = Temporal.Now.instant();
            previous.timeoutId = undefined;
            callback();
          }, remainingWaitTime.total("milliseconds"));
        } else {
          previous.t = now;
          previous.timeoutId = undefined;
          callback();
        }
      }
    } else {
      this.history.set(id, { t: now });
      callback();
    }
  }
}
