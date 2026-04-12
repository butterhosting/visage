import { NullSentinel } from "@/helpers/NullSentinel";
import { Period } from "@/models/Period";
import { Stats } from "@/models/Stats";
import { DistributionFilter } from "@/website/femodels/DistributionFilter";
import { Graph } from "@/website/femodels/Graph";
import { Temporal } from "@js-temporal/polyfill";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useRegistry } from "../useRegistry";

export function useDashboardUrlState() {
  const [params, setParams] = useSearchParams();
  const { O_VISAGE_TIMEZONE } = useRegistry("env");

  const graphDefault = Graph.visitors;
  const [graph, setGraph] = useState<Graph>(() => {
    const graphParam = params.get("graph") as Graph;
    return Object.values(Graph).includes(graphParam) ? graphParam : graphDefault;
  });

  let graphTimeSeriesField: Stats.Field.visitorsTimeSeries | Stats.Field.pageviewsTimeSeries | Stats.Field.pagetimeTimeSeries;
  switch (graph) {
    case Graph.visitors: {
      graphTimeSeriesField = Stats.Field.visitorsTimeSeries;
      break;
    }
    case Graph.pageviews: {
      graphTimeSeriesField = Stats.Field.pageviewsTimeSeries;
      break;
    }
    case Graph.pagetime: {
      graphTimeSeriesField = Stats.Field.pagetimeTimeSeries;
      break;
    }
  }

  const periodPresetDefault = Period.defaultPreset();
  const [period, setPeriod] = useState<Period>(() => {
    let presetParam = params.get("period") as Period.Preset;
    if (/^\d+d$/.test(presetParam)) {
      presetParam = `last${presetParam}` as Period.Preset;
    }
    if (Object.values(Period.Preset).includes(presetParam)) {
      if (presetParam === Period.Preset.custom) {
        const fromParam = params.get("from") || undefined;
        const toParam = params.get("to") || undefined;
        if (fromParam && toParam) {
          const { fromInstant, toInstant } = Period.fromDates(
            {
              fromDate: Temporal.PlainDate.from(fromParam),
              toDate: Temporal.PlainDate.from(toParam),
            },
            O_VISAGE_TIMEZONE,
          );
          try {
            return {
              preset: presetParam,
              from: fromInstant,
              to: toInstant,
            };
          } catch (e) {
            // ignore and fall through
          }
        }
      } else {
        return Period.forPreset(presetParam, O_VISAGE_TIMEZONE);
      }
    }
    return Period.forPreset(Period.Preset.last30d, O_VISAGE_TIMEZONE);
  });

  const [filters, setFilters] = useState<DistributionFilter[]>(() => {
    const result: DistributionFilter[] = [];
    Object.values(DistributionFilter.Key).forEach((key) => {
      const value = params.get(key);
      if (typeof value === "string") {
        result.push({ key, value: NullSentinel.decode(value) });
      }
    });
    return result;
  });

  useEffect(() => {
    setParams(
      (params) => {
        // graph
        if (graph === graphDefault) {
          params.delete("graph");
        } else {
          params.set("graph", graph);
        }

        // period
        if (period.preset === periodPresetDefault) {
          params.delete("period");
          params.delete("from");
          params.delete("to");
        } else {
          params.set("period", /^last\d+d$/.test(period.preset) ? period.preset.slice("last".length) : period.preset);
          if (period.preset === Period.Preset.custom) {
            const { from: fromInstant, to: toInstant } = period;
            if (!fromInstant || !toInstant) {
              throw new Error(`Illegal state: both "from" and "to" should be set for custom periods`);
            }
            const { fromDate, toDate } = Period.toDates({ fromInstant, toInstant }, O_VISAGE_TIMEZONE);
            params.set("from", fromDate.toString());
            params.set("to", toDate.toString());
          } else {
            params.delete("from");
            params.delete("to");
          }
        }

        // filters
        Object.values(DistributionFilter.Key).forEach((targetKey) => {
          const activeFilter = filters.find(({ key }) => key === targetKey);
          if (activeFilter) {
            params.set(targetKey, NullSentinel.encode(activeFilter.value));
          } else {
            params.delete(targetKey);
          }
        });

        return params;
      },
      { replace: true },
    );
  }, [graph, JSON.stringify(period), JSON.stringify(filters)]);

  return {
    graph,
    graphTimeSeriesField: graphTimeSeriesField,
    setGraph,
    period,
    setPeriod,
    filters,
    setFilters,
  };
}
