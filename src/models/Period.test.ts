import { describe, expect, it, spyOn } from "bun:test";
import { Temporal } from "@js-temporal/polyfill";
import { Period } from "./Period";

describe("Period", () => {
  describe(Period.defaultPreset.name, () => {
    it("returns last30d", () => {
      expect(Period.defaultPreset()).toEqual(Period.Preset.last30d);
    });
  });

  describe(Period.forPreset.name, () => {
    const testCases: Array<{
      today: string;
      preset: Exclude<Period.Preset, Period.Preset.custom>;
      timezone: string;
      expectation: { from?: string; to?: string };
    }> = [
      // --- UTC basic presets ---
      {
        today: "2025-12-31",
        preset: Period.Preset.today,
        timezone: "UTC",
        expectation: { from: "2025-12-31T00:00:00Z", to: "2026-01-01T00:00:00Z" },
      },
      {
        today: "2025-12-31",
        preset: Period.Preset.yesterday,
        timezone: "UTC",
        expectation: { from: "2025-12-30T00:00:00Z", to: "2025-12-31T00:00:00Z" },
      },
      {
        today: "2025-06-15",
        preset: Period.Preset.last7d,
        timezone: "UTC",
        expectation: { from: "2025-06-08T00:00:00Z", to: "2025-06-16T00:00:00Z" },
      },
      {
        today: "2025-06-15",
        preset: Period.Preset.last30d,
        timezone: "UTC",
        expectation: { from: "2025-05-16T00:00:00Z", to: "2025-06-16T00:00:00Z" },
      },
      {
        today: "2025-06-15",
        preset: Period.Preset.last90d,
        timezone: "UTC",
        expectation: { from: "2025-03-17T00:00:00Z", to: "2025-06-16T00:00:00Z" },
      },
      { today: "2025-06-15", preset: Period.Preset.all, timezone: "UTC", expectation: { from: undefined, to: undefined } },

      // --- year boundary: last7d crosses into previous year ---
      {
        today: "2026-01-03",
        preset: Period.Preset.last7d,
        timezone: "UTC",
        expectation: { from: "2025-12-27T00:00:00Z", to: "2026-01-04T00:00:00Z" },
      },

      // --- positive UTC offset (Asia/Tokyo = UTC+9) ---
      // "today" at midnight JST is 15:00 UTC the day before
      {
        today: "2025-08-10",
        preset: Period.Preset.today,
        timezone: "Asia/Tokyo",
        expectation: { from: "2025-08-09T15:00:00Z", to: "2025-08-10T15:00:00Z" },
      },
      {
        today: "2025-08-10",
        preset: Period.Preset.yesterday,
        timezone: "Asia/Tokyo",
        expectation: { from: "2025-08-08T15:00:00Z", to: "2025-08-09T15:00:00Z" },
      },

      // --- negative UTC offset (America/New_York = UTC-4 in summer / UTC-5 in winter) ---
      // summer (EDT, UTC-4): midnight ET = 04:00 UTC
      {
        today: "2025-07-01",
        preset: Period.Preset.today,
        timezone: "America/New_York",
        expectation: { from: "2025-07-01T04:00:00Z", to: "2025-07-02T04:00:00Z" },
      },
      // winter (EST, UTC-5): midnight ET = 05:00 UTC
      {
        today: "2025-01-15",
        preset: Period.Preset.today,
        timezone: "America/New_York",
        expectation: { from: "2025-01-15T05:00:00Z", to: "2025-01-16T05:00:00Z" },
      },

      // --- DST spring-forward (US): Mar 9, 2025 at 2am clocks jump to 3am ---
      // "today" on the spring-forward day is only 23 hours long
      {
        today: "2025-03-09",
        preset: Period.Preset.today,
        timezone: "America/New_York",
        expectation: { from: "2025-03-09T05:00:00Z", to: "2025-03-10T04:00:00Z" },
      },
      // "yesterday" spans a normal 24-hour day before the transition
      {
        today: "2025-03-09",
        preset: Period.Preset.yesterday,
        timezone: "America/New_York",
        expectation: { from: "2025-03-08T05:00:00Z", to: "2025-03-09T05:00:00Z" },
      },

      // --- DST fall-back (US): Nov 2, 2025 at 2am clocks go back to 1am ---
      // "today" on the fall-back day is 25 hours long
      {
        today: "2025-11-02",
        preset: Period.Preset.today,
        timezone: "America/New_York",
        expectation: { from: "2025-11-02T04:00:00Z", to: "2025-11-03T05:00:00Z" },
      },
    ];

    for (const { today, preset, timezone, expectation } of testCases) {
      it(`${preset} on ${today} in ${timezone}`, () => {
        // given
        const todaySpy = spyOn(Temporal.Now, "plainDateISO");
        todaySpy.mockReturnValue(Temporal.PlainDate.from(today));
        // when
        const period = Period.forPreset(preset, timezone);
        // then
        expect(period.preset).toEqual(preset);
        expect(period.from?.toString()).toEqual(expectation.from);
        expect(period.to?.toString()).toEqual(expectation.to);
      });
    }
  });

  describe(Period.fromDates.name, () => {
    it("converts a date pair to instants at day boundaries", () => {
      const { fromInstant, toInstant } = Period.fromDates(
        { fromDate: Temporal.PlainDate.from("2025-06-01"), toDate: Temporal.PlainDate.from("2025-06-30") },
        "UTC",
      );
      expect(fromInstant.toString()).toEqual("2025-06-01T00:00:00Z");
      expect(toInstant.toString()).toEqual("2025-07-01T00:00:00Z");
    });

    it("respects timezone offsets", () => {
      const { fromInstant, toInstant } = Period.fromDates(
        { fromDate: Temporal.PlainDate.from("2025-08-01"), toDate: Temporal.PlainDate.from("2025-08-01") },
        "Asia/Tokyo",
      );
      // midnight JST = 15:00 UTC previous day
      expect(fromInstant.toString()).toEqual("2025-07-31T15:00:00Z");
      // end of Aug 1 JST = start of Aug 2 JST = 15:00 UTC Aug 1
      expect(toInstant.toString()).toEqual("2025-08-01T15:00:00Z");
    });

    it("throws when fromDate equals toDate in a way that produces from >= to", () => {
      // single-day range is valid (from = start of day, to = start of next day)
      // but if fromDate is AFTER toDate, it should throw
      expect(() =>
        Period.fromDates({ fromDate: Temporal.PlainDate.from("2025-06-15"), toDate: Temporal.PlainDate.from("2025-06-14") }, "UTC"),
      ).toThrow();
    });

    it("throws when fromDate equals toDate and they resolve to the same instant", () => {
      // This won't actually happen because endOfDay adds 1 day, so same date produces from < to
      // Verify single-day range works fine
      const { fromInstant, toInstant } = Period.fromDates(
        { fromDate: Temporal.PlainDate.from("2025-06-15"), toDate: Temporal.PlainDate.from("2025-06-15") },
        "UTC",
      );
      expect(fromInstant.toString()).toEqual("2025-06-15T00:00:00Z");
      expect(toInstant.toString()).toEqual("2025-06-16T00:00:00Z");
    });
  });

  describe(Period.toDates.name, () => {
    it("converts instants back to dates", () => {
      const { fromDate, toDate } = Period.toDates(
        { fromInstant: Temporal.Instant.from("2025-06-01T00:00:00Z"), toInstant: Temporal.Instant.from("2025-07-01T00:00:00Z") },
        "UTC",
      );
      expect(fromDate.toString()).toEqual("2025-06-01");
      // toDate is the last inclusive day, so end-of-day instant for Jul 1 means toDate = Jun 30
      expect(toDate.toString()).toEqual("2025-06-30");
    });

    it("round-trips with fromDates", () => {
      const original = { fromDate: Temporal.PlainDate.from("2025-03-15"), toDate: Temporal.PlainDate.from("2025-04-20") };
      const instants = Period.fromDates(original, "America/New_York");
      const roundTripped = Period.toDates(instants, "America/New_York");
      expect(roundTripped.fromDate.toString()).toEqual(original.fromDate.toString());
      expect(roundTripped.toDate.toString()).toEqual(original.toDate.toString());
    });

    it("round-trips across DST boundary", () => {
      // range spanning spring-forward
      const original = { fromDate: Temporal.PlainDate.from("2025-03-08"), toDate: Temporal.PlainDate.from("2025-03-10") };
      const instants = Period.fromDates(original, "America/New_York");
      const roundTripped = Period.toDates(instants, "America/New_York");
      expect(roundTripped.fromDate.toString()).toEqual(original.fromDate.toString());
      expect(roundTripped.toDate.toString()).toEqual(original.toDate.toString());
    });

    it("throws when fromInstant >= toInstant", () => {
      expect(() =>
        Period.toDates(
          { fromInstant: Temporal.Instant.from("2025-06-15T00:00:00Z"), toInstant: Temporal.Instant.from("2025-06-15T00:00:00Z") },
          "UTC",
        ),
      ).toThrow();
    });

    it("throws when instant is not at start-of-day boundary", () => {
      expect(() =>
        Period.toDates(
          { fromInstant: Temporal.Instant.from("2025-06-15T12:30:00Z"), toInstant: Temporal.Instant.from("2025-06-16T00:00:00Z") },
          "UTC",
        ),
      ).toThrow(/start-of-day/);
    });
  });
});
