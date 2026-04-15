import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Temporal } from "@js-temporal/polyfill";
import { Throttler } from "./Throttler";

type FakeScheduler = {
  setTimeoutFn: typeof setTimeout;
  remaining: Array<{ fn: () => void; delayMs: number }>;
  flush: () => void;
};

describe(Throttler.name, () => {
  let fakeScheduler: FakeScheduler;
  let throttler: Throttler;

  beforeEach(() => {
    const remaining: FakeScheduler["remaining"] = [];
    const setTimeoutFn = ((fn: () => void, delayMs: number) => {
      const timer = { fn, delayMs };
      remaining.push(timer);
      return timer as unknown as NodeJS.Timeout;
    }) as typeof setTimeout;
    fakeScheduler = {
      setTimeoutFn,
      remaining: remaining,
      flush: () => {
        const toRun = remaining.splice(0, remaining.length);
        toRun.forEach((t) => t.fn());
      },
    };
    throttler = new Throttler({
      cooldown: Temporal.Duration.from({ milliseconds: 500 }),
      setTimeoutFn,
    });
  });

  it("fires the first submission immediately without scheduling", () => {
    // given
    const callback = mock();
    // when
    throttler.submit("a", callback);
    // then
    expect(callback).toHaveBeenCalledTimes(1);
    expect(fakeScheduler.remaining).toHaveLength(0);
  });

  it("defers a second submission within the cooldown window", () => {
    // given
    const callback = mock();
    // when
    throttler.submit("a", callback);
    throttler.submit("a", callback);
    // then
    expect(callback).toHaveBeenCalledTimes(1);
    expect(fakeScheduler.remaining).toHaveLength(1);
    expect(fakeScheduler.remaining[0].delayMs).toBeGreaterThan(0);
    expect(fakeScheduler.remaining[0].delayMs).toBeLessThanOrEqual(500);
  });

  it("fires immediately once the cooldown has fully elapsed", async () => {
    // given
    const realThrottler = new Throttler({
      cooldown: Temporal.Duration.from({ milliseconds: 10 }),
    });
    const callback = mock();
    realThrottler.submit("a", callback);

    // when
    await Bun.sleep(20);
    realThrottler.submit("a", callback);

    // then
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("coalesces repeated submissions into a single trailing call", () => {
    // given
    const callback = mock();

    // when
    throttler.submit("a", callback);
    throttler.submit("a", callback);
    throttler.submit("a", callback);
    throttler.submit("a", callback);
    // then
    expect(callback).toHaveBeenCalledTimes(1);
    expect(fakeScheduler.remaining).toHaveLength(1);

    // when
    fakeScheduler.flush();
    // then
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("tracks different keys independently", () => {
    // given
    const callback = mock();
    // when
    throttler.submit("a", callback);
    throttler.submit("b", callback);
    throttler.submit("c", callback);
    // then
    expect(callback).toHaveBeenCalledTimes(3);
    expect(fakeScheduler.remaining).toHaveLength(0);
  });

  it("re-arms the cooldown after the trailing call runs", () => {
    // given
    const callback = mock();
    // when
    throttler.submit("a", callback);
    throttler.submit("a", callback);
    fakeScheduler.flush();
    throttler.submit("a", callback);
    // then
    expect(callback).toHaveBeenCalledTimes(2);
    expect(fakeScheduler.remaining).toHaveLength(1);
  });
});
