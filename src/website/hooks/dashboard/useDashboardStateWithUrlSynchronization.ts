import { NullSentinel } from "@/helpers/NullSentinel";
import { Period } from "@/models/Period";
import { Stats } from "@/models/Stats";
import { DistributionFilter } from "@/website/femodels/DistributionFilter";
import { Graph } from "@/website/femodels/Graph";
import { Temporal } from "@js-temporal/polyfill";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useRegistry } from "../useRegistry";

/**
 * TODO: this has some bugs ... the "params update" should happen in a single useEffect, instead of 3
 * See this warning: https://reactrouter.com/api/hooks/useSearchParams
 */
export function useDashboardStateWithUrlSynchronization() {
  const [params, setParams] = useSearchParams();
  const { O_VISAGE_TIMEZONE } = useRegistry("env");

  function syncToParams(paramType: "graph", graph: Graph): void;
  function syncToParams(paramType: "period", period: Period): void;
  function syncToParams(paramType: "filters", filters: DistributionFilter[]): void;
  function syncToParams(paramType: "graph" | "period" | "filters", object: Graph | Period | DistributionFilter[]): void {
    console.log({ paramType });
    switch (paramType) {
      case "graph": {
        const graph = object as Graph;
        return setParams(
          (params) => {
            if (graph === graphDefault) {
              params.delete("graph");
            } else {
              params.set("graph", graph);
            }
            return params;
          },
          { replace: true },
        );
      }
      case "period": {
        const period = object as Period;
        return setParams(
          (params) => {
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
            return params;
          },
          { replace: true },
        );
      }
      case "filters": {
        const filters = object as DistributionFilter[];
        return setParams(
          (params) => {
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
      presetParam = `last${presetParam}` as Period.Preset; // keep the `last` prefix out for nicer query params
    }
    if (Object.values(Period.Preset).includes(presetParam)) {
      if (presetParam === Period.Preset.custom) {
        const fromParam = params.get("from") || undefined;
        const toParam = params.get("to") || undefined;
        if (fromParam && toParam) {
          // in custom ranges, both "from" and "to" must be specified via the UI
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
        // fall through
      } else {
        return Period.forPreset(presetParam, O_VISAGE_TIMEZONE);
      }
    }
    return Period.forPreset(Period.Preset.last30d, O_VISAGE_TIMEZONE);
  });
  useEffect(() => syncToParams("period", period), [JSON.stringify(period)]);

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
