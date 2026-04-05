import { Stats } from "@/models/Stats";
import { DistributionFilter } from "./DistributionFilter";

export type PanelTab = {
  label: string;
  field: Stats.Field;
  filterKey: DistributionFilter.Key;
};
