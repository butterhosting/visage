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
}
