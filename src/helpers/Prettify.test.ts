import { describe, expect, it } from "bun:test";
import { Prettify } from "./Prettify";
import { Temporal } from "@js-temporal/polyfill";

describe("Prettify", () => {
  describe(Prettify.timestamp.name, () => {
    it("formats with year, abbreviated month, and seconds", () => {
      const instant = Temporal.Instant.from("2026-01-03T14:05:09Z");
      expect(Prettify.timestamp(instant, "UTC", { yearFmt: "present", monthFmt: "abbrev", secondFmt: "present" })).toEqual(
        "3 Jan 2026, 14:05:09",
      );
    });

    it("formats without year", () => {
      const instant = Temporal.Instant.from("2026-12-01T00:00:00Z");
      expect(Prettify.timestamp(instant, "UTC", { yearFmt: "absent", monthFmt: "abbrev", secondFmt: "present" })).toEqual(
        "1 Dec, 00:00:00",
      );
    });

    it("formats with full month name", () => {
      const instant = Temporal.Instant.from("2026-03-02T23:59:59Z");
      expect(Prettify.timestamp(instant, "UTC", { yearFmt: "present", monthFmt: "full", secondFmt: "present" })).toEqual(
        "2 March 2026, 23:59:59",
      );
    });

    it("formats without seconds", () => {
      const instant = Temporal.Instant.from("2026-07-11T08:30:45Z");
      expect(Prettify.timestamp(instant, "UTC", { yearFmt: "present", monthFmt: "abbrev", secondFmt: "absent" })).toEqual(
        "11 Jul 2026, 08:30",
      );
    });

    it("respects timezone", () => {
      const instant = Temporal.Instant.from("2026-01-01T02:00:00Z");
      expect(Prettify.timestamp(instant, "America/New_York", { yearFmt: "present", monthFmt: "abbrev", secondFmt: "present" })).toEqual(
        "31 Dec 2025, 21:00:00",
      );
    });
  });

  describe(Prettify.month.name, () => {
    it("formats with abbreviated month", () => {
      const instant = Temporal.Instant.from("2026-06-15T12:00:00Z");
      expect(Prettify.month(instant, "UTC", { monthFmt: "abbrev", yearFmt: "present" })).toEqual("Jun 2026");
    });

    it("formats with full month name", () => {
      const instant = Temporal.Instant.from("2026-06-15T12:00:00Z");
      expect(Prettify.month(instant, "UTC", { monthFmt: "full", yearFmt: "present" })).toEqual("June 2026");
    });

    it("formats without year", () => {
      const instant = Temporal.Instant.from("2026-06-15T12:00:00Z");
      expect(Prettify.month(instant, "UTC", { monthFmt: "abbrev", yearFmt: "absent" })).toEqual("Jun");
    });

    it("respects timezone", () => {
      const instant = Temporal.Instant.from("2026-01-01T02:00:00Z");
      expect(Prettify.month(instant, "America/New_York", { monthFmt: "full", yearFmt: "present" })).toEqual("December 2025");
    });
  });

  describe(Prettify.day.name, () => {
    it("formats PlainDate with abbreviated month, no year", () => {
      const date = Temporal.PlainDate.from("2026-04-05");
      expect(Prettify.day(date, { monthFmt: "abbrev", yearFmt: "absent" })).toEqual("5 Apr");
    });

    it("formats PlainDate with full month and year", () => {
      const date = Temporal.PlainDate.from("2026-04-05");
      expect(Prettify.day(date, { monthFmt: "full", yearFmt: "present" })).toEqual("5 April 2026");
    });

    it("formats Instant with abbreviated month, no year", () => {
      const instant = Temporal.Instant.from("2026-04-05T12:00:00Z");
      expect(Prettify.day(instant, "UTC", { monthFmt: "abbrev", yearFmt: "absent" })).toEqual("5 Apr");
    });

    it("formats Instant with full month and year", () => {
      const instant = Temporal.Instant.from("2026-04-05T12:00:00Z");
      expect(Prettify.day(instant, "UTC", { monthFmt: "full", yearFmt: "present" })).toEqual("5 April 2026");
    });

    it("respects timezone", () => {
      const instant = Temporal.Instant.from("2026-01-01T02:00:00Z");
      expect(Prettify.day(instant, "America/New_York", { monthFmt: "abbrev", yearFmt: "present" })).toEqual("31 Dec 2025");
    });
  });

  describe(Prettify.number.name, () => {
    it("formats small numbers as-is", () => {
      expect(Prettify.number(42)).toEqual("42");
    });

    it("formats thousands with k suffix", () => {
      expect(Prettify.number(1_500)).toEqual("1.5k");
    });

    it("formats millions with M suffix", () => {
      expect(Prettify.number(2_300_000)).toEqual("2.3M");
    });
  });

  describe(Prettify.percentage.name, () => {
    it("formats zero as <0.1%", () => {
      expect(Prettify.percentage(0)).toEqual("<0.1%");
    });

    it("formats 100 without decimal", () => {
      expect(Prettify.percentage(100)).toEqual("100%");
    });

    it("formats with one decimal", () => {
      expect(Prettify.percentage(42.567)).toEqual("42.6%");
    });
  });

  describe(Prettify.duration.name, () => {
    it("formats seconds only", () => {
      expect(Prettify.duration(45)).toEqual("45s");
    });

    it("formats minutes and seconds", () => {
      expect(Prettify.duration(125)).toEqual("2m 5s");
    });
  });
});
