import { StatsQuery } from "@/models/StatsQuery";

export type DistributionFilter = Exclude<StatsQuery.Filter, StatsQuery.Filter.from | StatsQuery.Filter.to>;
