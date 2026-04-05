import { Temporal } from "@js-temporal/polyfill";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Stats } from "@/models/Stats";
import { DistributionFilter } from "@/website/femodels/DistributionFilter";
import { Graph } from "@/website/femodels/Graph";
import { Period } from "@/website/femodels/Period";

export function useDashboardStateWithUrlSynchronization() {
  const [params, setParams] = useSearchParams();

  function syncToParams(paramType: "graph", graph: Graph): void;
  function syncToParams(paramType: "period", period: Period): void;
  function syncToParams(paramType: "filters", filters: DistributionFilter[]): void;
  function syncToParams(paramType: "graph" | "period" | "filters", object: Graph | Period | DistributionFilter[]): void {
    switch (paramType) {
      case "graph": {
        const graph = object as Graph;
        return setParams((params) => {
          if (graph === graphDefault) {
            params.delete("graph");
          } else {
            params.set("graph", graph);
          }
          return params;
        });
      }
      case "period": {
        const period = object as Period;
        return setParams((params) => {
          if (period.preset === periodPresetDefault) {
            params.delete("period");
            params.delete("from");
            params.delete("to");
          } else {
            params.set("period", /^last\d+d$/.test(period.preset) ? period.preset.slice("last".length) : period.preset);
            if (period.preset === Period.Preset.custom) {
              if (period.from) {
                params.set("from", period.from.toZonedDateTimeISO("UTC").toPlainDate().toString());
              }
              if (period.to) {
                // apply "-1 days" because the instant is exclusive ...
                params.set("to", period.to.toZonedDateTimeISO("UTC").toPlainDate().subtract({ days: 1 }).toString());
              }
            }
          }
          return params;
        });
      }
      case "filters": {
        const filters = object as DistributionFilter[];
        return setParams((params) => {
          Object.values(DistributionFilter.Key).forEach((targetKey) => {
            const activeFilter = filters.find(({ key }) => key === targetKey);
            if (activeFilter) {
              params.set(targetKey, activeFilter.value);
            } else {
              params.delete(targetKey);
            }
          });
          return params;
        });
      }
      default: {
        paramType satisfies never;
      }
    }
  }

  const graphDefault = Graph.visitors;
  const [graph, setGraph] = useState<Graph>(() => {
    const graphParam = params.get("graph") as Graph;
    return Object.values(Graph).includes(graphParam) ? graphParam : graphDefault;
  });
  useEffect(() => syncToParams("graph", graph), [graph]);

  let graphTimeSeriesField: Stats.Field.visitorsTimeSeries | Stats.Field.pageviewsTimeSeries | Stats.Field.durationTimeSeries;
  switch (graph) {
    case Graph.visitors: {
      graphTimeSeriesField = Stats.Field.visitorsTimeSeries;
      break;
    }
    case Graph.pageviews: {
      graphTimeSeriesField = Stats.Field.pageviewsTimeSeries;
      break;
    }
    case Graph.duration: {
      graphTimeSeriesField = Stats.Field.durationTimeSeries;
      break;
    }
  }

  const periodPresetDefault = Period.Preset.last30d;
  const [period, setPeriod] = useState<Period>(() => {
    let presetParam = params.get("period") as Period.Preset;
    if (/^\d+d$/.test(presetParam)) {
      presetParam = `last${presetParam}` as Period.Preset; // keep the `last` prefix out for nicer query params
    }
    if (Object.values(Period.Preset).includes(presetParam)) {
      if (presetParam === Period.Preset.custom) {
        const fromParam = params.get("from") || undefined;
        const toParam = params.get("to") || undefined;
        if (fromParam && toParam) {
          // in custom ranges, both "from" and "to" must be specified via the UI
          try {
            return {
              preset: presetParam,
              from: Temporal.PlainDate.from(fromParam).toZonedDateTime("UTC").toInstant(),
              to: Temporal.PlainDate.from(toParam).add({ days: 1 }).toZonedDateTime("UTC").toInstant(),
            };
          } catch (e) {
            // ignore and fall through
          }
        }
        // fall through
      } else {
        return Period.forPreset(presetParam);
      }
    }
    return Period.forPreset(Period.Preset.last30d);
  });
  useEffect(() => syncToParams("period", period), [JSON.stringify(period)]);

  const [filters, setFilters] = useState<DistributionFilter[]>(() => {
    const result: DistributionFilter[] = [];
    Object.values(DistributionFilter.Key).forEach((key) => {
      const value = params.get(key);
      if (typeof value === "string") {
        result.push({ key, value });
      }
    });
    return result;
  });
  useEffect(() => syncToParams("filters", filters), [JSON.stringify(filters)]);

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
