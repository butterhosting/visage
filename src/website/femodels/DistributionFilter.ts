import { StatsQuery } from "@/models/StatsQuery";

export type DistributionFilter = {
  key: DistributionFilter.Key;
  value: string | null;
};

export namespace DistributionFilter {
  export type Key = Exclude<StatsQuery.Filter, StatsQuery.Filter.from | StatsQuery.Filter.to>;
  export const Key: { [K in Key]: K } = {
    page: StatsQuery.Filter.page,
    source: StatsQuery.Filter.source,
    screen: StatsQuery.Filter.screen,
    browser: StatsQuery.Filter.browser,
    os: StatsQuery.Filter.os,
    country: StatsQuery.Filter.country,
    city: StatsQuery.Filter.city,
  };

  export type ToggleFn = (key: Key, value: string | null) => void;

  const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
  const translatedNullValues: Partial<Record<DistributionFilter.Key, string>> = {
    source: "(direct)",
  };
  export function renderValue(key: Key, value: string | null): string {
    if (value === null) {
      return translatedNullValues[key] ?? "(unknown)";
    }
    if (key === DistributionFilter.Key.country) {
      const fullCountryName = countryNames.of(value);
      if (fullCountryName) {
        return fullCountryName;
      }
    }

    return value;
  }
}
